import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Event } from '../entities/Event';
import { Group } from '../entities/Group';
import { Payment } from '../entities/Payment';
import { User } from '../entities/User';
import { UpdateRequest } from '../entities/UpdateRequest';
import { GroupMember } from '../entities/GroupMember';
import { logger } from '../utils/logger';
import { broadcastToAll, broadcastToAddress } from '../config/websocket';
import { getRepository } from '../config/database';

const router = Router();

// Webhook for blockchain events
router.post('/blockchain-events', [
  body('events').isArray(),
  body('events.*.eventType').isString(),
  body('events.*.contractAddress').isString(),
  body('events.*.transactionHash').isString(),
  body('events.*.blockNumber').isNumeric(),
  body('events.*.logIndex').isNumeric(),
  body('events.*.eventData').isObject()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { events } = req.body;
    const eventRepo = getRepository(Event);
    const processedEvents: any[] = [];

    for (const eventData of events) {
      try {
        // Save event to database
        const event = eventRepo.create({
          eventType: eventData.eventType,
          contractAddress: eventData.contractAddress,
          transactionHash: eventData.transactionHash,
          blockNumber: eventData.blockNumber,
          logIndex: eventData.logIndex,
          eventData: JSON.stringify(eventData.eventData),
          isProcessed: false
        });

        const savedEvent = await eventRepo.save(event);
        processedEvents.push(savedEvent);

        // Process event based on type
        await processBlockchainEvent(eventData);

        // Mark as processed
        savedEvent.isProcessed = true;
        savedEvent.processedAt = new Date();
        await eventRepo.save(savedEvent);

        logger.info(`Processed blockchain event: ${eventData.eventType}`);
      } catch (error) {
        logger.error(`Error processing event ${eventData.eventType}:`, error);
      }
    }

    res.json({
      message: 'Events processed successfully',
      processedCount: processedEvents.length
    });
  } catch (error) {
    logger.error('Error processing blockchain events:', error);
    res.status(500).json({ error: { message: 'Failed to process blockchain events' } });
  }
});

// Process different types of blockchain events
async function processBlockchainEvent(eventData: any): Promise<void> {
  const { eventType, eventData: eventDataString } = eventData;
  const data = typeof eventDataString === 'string' ? JSON.parse(eventDataString) : eventDataString;

  switch (eventType) {
    case 'GroupCreated':
      await processGroupCreated(data);
      break;
    case 'GroupUpdated':
      await processGroupUpdated(data);
      break;
    case 'GroupUpdateRequested':
      await processGroupUpdateRequested(data);
      break;
    case 'GroupUpdateApproved':
      await processGroupUpdateApproved(data);
      break;
    case 'Payment':
      await processPayment(data);
      break;
    default:
      logger.warn(`Unknown event type: ${eventType}`);
  }
}

async function processGroupCreated(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);
    const userRepo = getRepository(User);

    // Check if group already exists
    const existingGroup = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (existingGroup) {
      logger.info(`Group ${data.group_id} already exists in database`);
      return;
    }

    // Get or create user
    let user = await userRepo.findOne({ where: { address: data.creator } });
    if (!user) {
      user = userRepo.create({ address: data.creator });
      await userRepo.save(user);
    }

    // Create group
    const group = groupRepo.create({
      groupId: data.group_id.toString(),
      name: data.name,
      amount: data.amount.toString(),
      creatorAddress: data.creator,
      memberCount: 0, // Will be updated when members are processed
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber
    });

    await groupRepo.save(group);

    // Update user stats
    user.totalGroupsCreated += 1;
    await userRepo.save(user);

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'group_created',
      data: { group }
    });

    logger.info(`Group created: ${data.group_id}`);
  } catch (error) {
    logger.error('Error processing GroupCreated event:', error);
  }
}

async function processGroupUpdated(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);

    const group = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (!group) {
      logger.warn(`Group ${data.group_id} not found for update`);
      return;
    }

    // Update group with new data
    group.name = data.new_name;
    group.amount = data.new_amount.toString();
    group.isPaid = false; // Reset payment status
    group.hasPendingUpdate = false;
    group.approvalCount = 0;
    group.transactionHash = data.transactionHash;
    group.blockNumber = data.blockNumber;

    await groupRepo.save(group);

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'group_updated',
      data: { group }
    });

    logger.info(`Group updated: ${data.group_id}`);
  } catch (error) {
    logger.error('Error processing GroupUpdated event:', error);
  }
}

async function processGroupUpdateRequested(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);
    const updateRequestRepo = getRepository(UpdateRequest);

    const group = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (!group) {
      logger.warn(`Group ${data.group_id} not found for update request`);
      return;
    }

    // Create update request
    const updateRequest = updateRequestRepo.create({
      groupId: group.id,
      requesterAddress: data.requester,
      newName: data.new_name,
      newAmount: data.new_amount.toString(),
      feePaid: true,
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber
    });

    await updateRequestRepo.save(updateRequest);

    // Update group status
    group.hasPendingUpdate = true;
    await groupRepo.save(group);

    // Broadcast to group members
    const memberRepo = getRepository(GroupMember);
    const members = await memberRepo.find({ where: { groupId: group.id } });
    
    members.forEach(member => {
      broadcastToAddress(member.memberAddress, {
        type: 'group_update_requested',
        data: { group, updateRequest }
      });
    });

    logger.info(`Group update requested: ${data.group_id}`);
  } catch (error) {
    logger.error('Error processing GroupUpdateRequested event:', error);
  }
}

async function processGroupUpdateApproved(data: any): Promise<void> {
  try {
    const groupRepo = getRepository(Group);
    const memberRepo = getRepository(GroupMember);

    const group = await groupRepo.findOne({
      where: { groupId: data.group_id.toString() }
    });

    if (!group) {
      logger.warn(`Group ${data.group_id} not found for approval`);
      return;
    }

    // Update member approval status
    const member = await memberRepo.findOne({
      where: { groupId: group.id, memberAddress: data.approver }
    });

    if (member) {
      member.hasApprovedUpdate = true;
      member.lastApprovalDate = new Date();
      await memberRepo.save(member);
    }

    // Update group approval count
    group.approvalCount = data.approval_count;
    await groupRepo.save(group);

    // Check if all members have approved
    const totalMembers = await memberRepo.count({ where: { groupId: group.id } });
    const approvedMembers = await memberRepo.count({ 
      where: { groupId: group.id, hasApprovedUpdate: true } 
    });

    if (approvedMembers === totalMembers) {
      // All members approved, ready for execution
      broadcastToAddress(group.creatorAddress, {
        type: 'group_update_ready',
        data: { group, approvedMembers, totalMembers }
      });
    }

    logger.info(`Group update approved: ${data.group_id} by ${data.approver}`);
  } catch (error) {
    logger.error('Error processing GroupUpdateApproved event:', error);
  }
}

async function processPayment(data: any): Promise<void> {
  try {
    const paymentRepo = getRepository(Payment);
    const userRepo = getRepository(User);

    // Create payment record
    const payment = paymentRepo.create({
      groupId: data.group_id,
      fromAddress: data.from_address,
      toAddress: data.to_address,
      amount: data.amount.toString(),
      tokenAddress: data.token_address,
      status: 'completed',
      transactionHash: data.transaction_hash,
      blockNumber: data.block_number
    });

    await paymentRepo.save(payment);

    // Update user stats
    const sender = await userRepo.findOne({ where: { address: data.from_address } });
    if (sender) {
      sender.totalAmountPaid = (BigInt(sender.totalAmountPaid || '0') + BigInt(data.amount)).toString();
      await userRepo.save(sender);
    }

    const receiver = await userRepo.findOne({ where: { address: data.to_address } });
    if (receiver) {
      receiver.totalAmountReceived = (BigInt(receiver.totalAmountReceived || '0') + BigInt(data.amount)).toString();
      await userRepo.save(receiver);
    }

    // Broadcast to WebSocket
    broadcastToAll({
      type: 'payment_completed',
      data: { payment }
    });

    logger.info(`Payment processed: ${data.transaction_hash}`);
  } catch (error) {
    logger.error('Error processing Payment event:', error);
  }
}

// Health check for webhook
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint is healthy'
  });
});

export { router as webhookRoutes }; 