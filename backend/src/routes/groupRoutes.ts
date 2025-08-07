import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Group } from '../entities/Group';
import { GroupMember } from '../entities/GroupMember';
import { User } from '../entities/User';
import { UpdateRequest } from '../entities/UpdateRequest';
import { starknetService } from '../services/starknetService';
import { broadcastToAll, broadcastToAddress } from '../config/websocket';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { getRepository } from '../config/database';

const router = Router();

// Validation middleware
const validateGroupCreation = [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('amount').isString().matches(/^\d+$/),
  body('members').isArray({ min: 2 }),
  body('members.*.addr').isString().isLength({ min: 1 }),
  body('members.*.percentage').isInt({ min: 1, max: 100 }),
  body('tokenAddress').isString().isLength({ min: 1 })
];

const validateGroupUpdate = [
  body('newName').isString().isLength({ min: 1, max: 100 }),
  body('newAmount').isString().matches(/^\d+$/),
  body('newMembers').isArray({ min: 2 }),
  body('newMembers.*.addr').isString().isLength({ min: 1 }),
  body('newMembers.*.percentage').isInt({ min: 1, max: 100 })
];

// Get all groups
router.get('/', async (req: Request, res: Response) => {
  try {
    const groupRepo = getRepository(Group);
    const { page = 1, limit = 20, isPaid } = req.query;
    
    const queryBuilder = groupRepo.createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .leftJoinAndSelect('group.members', 'members')
      .orderBy('group.createdAt', 'DESC');

    if (isPaid !== undefined) {
      queryBuilder.where('group.isPaid = :isPaid', { isPaid: isPaid === 'true' });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const [groups, total] = await queryBuilder
      .skip(offset)
      .take(Number(limit))
      .getManyAndCount();

    res.json({
      data: groups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting groups:', error);
    res.status(500).json({ error: { message: 'Failed to get groups' } });
  }
});

// Get group by ID
router.get('/:id', [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const groupRepo = getRepository(Group);
    
    const group = await groupRepo.findOne({
      where: { id },
      relations: ['creator', 'members', 'members.user', 'payments']
    });

    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } });
    }

    res.json({ data: group });
  } catch (error) {
    logger.error('Error getting group:', error);
    res.status(500).json({ error: { message: 'Failed to get group' } });
  }
});

// Create group
router.post('/', validateGroupCreation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, amount, members, tokenAddress, creatorAddress, privateKey } = req.body;

    // Validate total percentage equals 100
    const totalPercentage = members.reduce((sum: number, member: any) => sum + member.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({ 
        error: { message: 'Total percentage must equal 100%' } 
      });
    }

    // Check for duplicate addresses
    const addresses = members.map((m: any) => m.addr);
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      return res.status(400).json({ 
        error: { message: 'Duplicate addresses found in members list' } 
      });
    }

    // Set account for transaction
    starknetService.setAccount(privateKey, creatorAddress);

    // Create group on blockchain
    const txHash = await starknetService.createGroup(name, amount, members, tokenAddress);
    
    if (!txHash) {
      return res.status(500).json({ error: { message: 'Failed to create group on blockchain' } });
    }

    // Save to database
    const groupRepo = getRepository(Group);
    const userRepo = getRepository(User);
    const memberRepo = getRepository(GroupMember);

    // Get or create user
    let user = await userRepo.findOne({ where: { address: creatorAddress } });
    if (!user) {
      user = userRepo.create({ address: creatorAddress });
      await userRepo.save(user);
    }

    // Create group
    const group = groupRepo.create({
      name,
      amount,
      creatorAddress,
      tokenAddress,
      memberCount: members.length,
      transactionHash: txHash
    });

    const savedGroup = await groupRepo.save(group);

    // Create group members
    const groupMembers = members.map((member: any) =>
      memberRepo.create({
        groupId: savedGroup.id,
        memberAddress: member.addr,
        percentage: member.percentage
      })
    );

    await memberRepo.save(groupMembers);

    // Update user stats
    user.totalGroupsCreated += 1;
    await userRepo.save(user);

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'group_created',
      data: { group: savedGroup, members: groupMembers }
    });

    res.status(201).json({
      data: {
        group: savedGroup,
        transactionHash: txHash,
        message: 'Group created successfully'
      }
    });
  } catch (error) {
    logger.error('Error creating group:', error);
    res.status(500).json({ error: { message: 'Failed to create group' } });
  }
});

// Pay group
router.post('/:id/pay', [
  param('id').isUUID(),
  body('payerAddress').isString(),
  body('privateKey').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { payerAddress, privateKey } = req.body;

    const groupRepo = getRepository(Group);
    const group = await groupRepo.findOne({ where: { id } });

    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } });
    }

    if (group.isPaid) {
      return res.status(400).json({ error: { message: 'Group is already paid' } });
    }

    if (group.creatorAddress !== payerAddress) {
      return res.status(403).json({ error: { message: 'Only group creator can pay' } });
    }

    // Set account for transaction
    starknetService.setAccount(privateKey, payerAddress);

    // Pay group on blockchain
    const txHash = await starknetService.payGroup(group.groupId);
    
    if (!txHash) {
      return res.status(500).json({ error: { message: 'Failed to pay group on blockchain' } });
    }

    // Update group status
    group.isPaid = true;
    group.transactionHash = txHash;
    await groupRepo.save(group);

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'group_paid',
      data: { group }
    });

    res.json({
      data: {
        group,
        transactionHash: txHash,
        message: 'Group paid successfully'
      }
    });
  } catch (error) {
    logger.error('Error paying group:', error);
    res.status(500).json({ error: { message: 'Failed to pay group' } });
  }
});

// Request group update
router.post('/:id/update-request', [
  param('id').isUUID(),
  ...validateGroupUpdate,
  body('requesterAddress').isString(),
  body('privateKey').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { newName, newAmount, newMembers, requesterAddress, privateKey } = req.body;

    // Validate total percentage equals 100
    const totalPercentage = newMembers.reduce((sum: number, member: any) => sum + member.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({ 
        error: { message: 'Total percentage must equal 100%' } 
      });
    }

    const groupRepo = getRepository(Group);
    const group = await groupRepo.findOne({ where: { id } });

    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } });
    }

    if (group.creatorAddress !== requesterAddress) {
      return res.status(403).json({ error: { message: 'Only group creator can request updates' } });
    }

    // Set account for transaction
    starknetService.setAccount(privateKey, requesterAddress);

    // Request update on blockchain
    const txHash = await starknetService.requestGroupUpdate(
      group.groupId,
      newName,
      newAmount,
      newMembers
    );
    
    if (!txHash) {
      return res.status(500).json({ error: { message: 'Failed to request group update on blockchain' } });
    }

    // Save update request to database
    const updateRequestRepo = getRepository(UpdateRequest);
    const updateRequest = updateRequestRepo.create({
      groupId: id,
      requesterAddress,
      newName,
      newAmount,
      feePaid: true,
      transactionHash: txHash
    });

    await updateRequestRepo.save(updateRequest);

    // Update group status
    group.hasPendingUpdate = true;
    await groupRepo.save(group);

    // Broadcast to group members
    const memberRepo = getRepository(GroupMember);
    const members = await memberRepo.find({ where: { groupId: id } });
    
    members.forEach(member => {
      broadcastToAddress(member.memberAddress, {
        type: 'group_update_requested',
        data: { group, updateRequest }
      });
    });

    res.json({
      data: {
        updateRequest,
        transactionHash: txHash,
        message: 'Group update requested successfully'
      }
    });
  } catch (error) {
    logger.error('Error requesting group update:', error);
    res.status(500).json({ error: { message: 'Failed to request group update' } });
  }
});

// Approve group update
router.post('/:id/approve-update', [
  param('id').isUUID(),
  body('approverAddress').isString(),
  body('privateKey').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { approverAddress, privateKey } = req.body;

    const groupRepo = getRepository(Group);
    const memberRepo = getRepository(GroupMember);
    
    const group = await groupRepo.findOne({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } });
    }

    // Check if user is a member
    const member = await memberRepo.findOne({
      where: { groupId: id, memberAddress: approverAddress }
    });

    if (!member) {
      return res.status(403).json({ error: { message: 'Only group members can approve updates' } });
    }

    if (member.hasApprovedUpdate) {
      return res.status(400).json({ error: { message: 'Already approved this update' } });
    }

    // Set account for transaction
    starknetService.setAccount(privateKey, approverAddress);

    // Approve update on blockchain
    const txHash = await starknetService.approveGroupUpdate(group.groupId);
    
    if (!txHash) {
      return res.status(500).json({ error: { message: 'Failed to approve group update on blockchain' } });
    }

    // Update member approval status
    member.hasApprovedUpdate = true;
    member.lastApprovalDate = new Date();
    await memberRepo.save(member);

    // Update group approval count
    group.approvalCount += 1;
    await groupRepo.save(group);

    // Check if all members have approved
    const totalMembers = await memberRepo.count({ where: { groupId: id } });
    const approvedMembers = await memberRepo.count({ 
      where: { groupId: id, hasApprovedUpdate: true } 
    });

    if (approvedMembers === totalMembers) {
      // All members approved, ready for execution
      broadcastToAddress(group.creatorAddress, {
        type: 'group_update_ready',
        data: { group, approvedMembers, totalMembers }
      });
    }

    res.json({
      data: {
        approvedMembers,
        totalMembers,
        transactionHash: txHash,
        message: 'Group update approved successfully'
      }
    });
  } catch (error) {
    logger.error('Error approving group update:', error);
    res.status(500).json({ error: { message: 'Failed to approve group update' } });
  }
});

// Execute group update
router.post('/:id/execute-update', [
  param('id').isUUID(),
  body('executorAddress').isString(),
  body('privateKey').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { executorAddress, privateKey } = req.body;

    const groupRepo = getRepository(Group);
    const group = await groupRepo.findOne({ where: { id } });

    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } });
    }

    if (group.creatorAddress !== executorAddress) {
      return res.status(403).json({ error: { message: 'Only group creator can execute updates' } });
    }

    if (!group.hasPendingUpdate) {
      return res.status(400).json({ error: { message: 'No pending update for this group' } });
    }

    // Set account for transaction
    starknetService.setAccount(privateKey, executorAddress);

    // Execute update on blockchain
    const txHash = await starknetService.executeGroupUpdate(group.groupId);
    
    if (!txHash) {
      return res.status(500).json({ error: { message: 'Failed to execute group update on blockchain' } });
    }

    // Update group with new data
    const updateRequestRepo = getRepository(UpdateRequest);
    const updateRequest = await updateRequestRepo.findOne({
      where: { groupId: id, isCompleted: false }
    });

    if (updateRequest) {
      group.name = updateRequest.newName;
      group.amount = updateRequest.newAmount;
      group.isPaid = false; // Reset payment status
      group.hasPendingUpdate = false;
      group.approvalCount = 0;
      group.transactionHash = txHash;
      await groupRepo.save(group);

      // Mark update request as completed
      updateRequest.isCompleted = true;
      await updateRequestRepo.save(updateRequest);

      // Reset member approval statuses
      const memberRepo = getRepository(GroupMember);
      await memberRepo.update(
        { groupId: id },
        { hasApprovedUpdate: false, lastApprovalDate: null }
      );
    }

    // Broadcast to all group members
    const memberRepo = getRepository(GroupMember);
    const members = await memberRepo.find({ where: { groupId: id } });
    
    members.forEach(member => {
      broadcastToAddress(member.memberAddress, {
        type: 'group_updated',
        data: { group }
      });
    });

    res.json({
      data: {
        group,
        transactionHash: txHash,
        message: 'Group update executed successfully'
      }
    });
  } catch (error) {
    logger.error('Error executing group update:', error);
    res.status(500).json({ error: { message: 'Failed to execute group update' } });
  }
});

// Get groups by address
router.get('/address/:address', [
  param('address').isString().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.params;
    const groupRepo = getRepository(Group);
    
    const groups = await groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.members', 'member')
      .where('member.memberAddress = :address', { address })
      .orWhere('group.creatorAddress = :address', { address })
      .leftJoinAndSelect('group.creator', 'creator')
      .leftJoinAndSelect('group.members', 'members')
      .orderBy('group.createdAt', 'DESC')
      .getMany();

    res.json({ data: groups });
  } catch (error) {
    logger.error('Error getting groups by address:', error);
    res.status(500).json({ error: { message: 'Failed to get groups by address' } });
  }
});

export { router as groupRoutes }; 