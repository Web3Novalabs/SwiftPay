import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { User } from '../entities/User';
import { Group } from '../entities/Group';
import { Payment } from '../entities/Payment';
import { logger } from '../utils/logger';
import { getRepository } from '../config/database';

const router = Router();

// Get user by address
router.get('/:address', [
  param('address').isString().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.params;
    const userRepo = getRepository(User);
    
    let user = await userRepo.findOne({ 
      where: { address },
      relations: ['createdGroups', 'groupMemberships', 'sentPayments', 'receivedPayments']
    });

    if (!user) {
      // Create user if doesn't exist
      user = userRepo.create({ address });
      await userRepo.save(user);
    }

    res.json({ data: user });
  } catch (error) {
    logger.error('Error getting user:', error);
    res.status(500).json({ error: { message: 'Failed to get user' } });
  }
});

// Update user profile
router.put('/:address', [
  param('address').isString().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.params;
    const { username, email, avatar } = req.body;
    
    const userRepo = getRepository(User);
    let user = await userRepo.findOne({ where: { address } });

    if (!user) {
      user = userRepo.create({ address });
    }

    // Update fields
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;

    await userRepo.save(user);

    res.json({ data: user });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: { message: 'Failed to update user' } });
  }
});

// Get user's groups
router.get('/:address/groups', [
  param('address').isString().isLength({ min: 1 }),
  query('type').optional().isIn(['created', 'joined', 'all'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.params;
    const { type = 'all', page = 1, limit = 20 } = req.query;
    
    const groupRepo = getRepository(Group);
    const queryBuilder = groupRepo.createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .leftJoinAndSelect('group.members', 'members')
      .orderBy('group.createdAt', 'DESC');

    switch (type) {
      case 'created':
        queryBuilder.where('group.creatorAddress = :address', { address });
        break;
      case 'joined':
        queryBuilder.leftJoin('group.members', 'member')
          .where('member.memberAddress = :address', { address });
        break;
      default:
        queryBuilder.leftJoin('group.members', 'member')
          .where('group.creatorAddress = :address', { address })
          .orWhere('member.memberAddress = :address', { address });
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
    logger.error('Error getting user groups:', error);
    res.status(500).json({ error: { message: 'Failed to get user groups' } });
  }
});

// Get user's payments
router.get('/:address/payments', [
  param('address').isString().isLength({ min: 1 }),
  query('type').optional().isIn(['sent', 'received', 'all'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.params;
    const { type = 'all', page = 1, limit = 20 } = req.query;
    
    const paymentRepo = getRepository(Payment);
    const queryBuilder = paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.group', 'group')
      .leftJoinAndSelect('payment.fromUser', 'fromUser')
      .leftJoinAndSelect('payment.toUser', 'toUser')
      .orderBy('payment.createdAt', 'DESC');

    switch (type) {
      case 'sent':
        queryBuilder.where('payment.fromAddress = :address', { address });
        break;
      case 'received':
        queryBuilder.where('payment.toAddress = :address', { address });
        break;
      default:
        queryBuilder.where('payment.fromAddress = :address', { address })
          .orWhere('payment.toAddress = :address', { address });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const [payments, total] = await queryBuilder
      .skip(offset)
      .take(Number(limit))
      .getManyAndCount();

    res.json({
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting user payments:', error);
    res.status(500).json({ error: { message: 'Failed to get user payments' } });
  }
});

// Get user statistics
router.get('/:address/stats', [
  param('address').isString().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.params;
    
    const userRepo = getRepository(User);
    const groupRepo = getRepository(Group);
    const paymentRepo = getRepository(Payment);

    // Get user
    let user = await userRepo.findOne({ where: { address } });
    if (!user) {
      user = userRepo.create({ address });
      await userRepo.save(user);
    }

    // Get additional stats
    const createdGroupsCount = await groupRepo.count({ where: { creatorAddress: address } });
    const joinedGroupsCount = await groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.members', 'member')
      .where('member.memberAddress = :address', { address })
      .getCount();

    const totalSentAmount = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(CAST(payment.amount AS DECIMAL))', 'total')
      .where('payment.fromAddress = :address', { address })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const totalReceivedAmount = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(CAST(payment.amount AS DECIMAL))', 'total')
      .where('payment.toAddress = :address', { address })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const stats = {
      totalGroupsCreated: createdGroupsCount,
      totalGroupsJoined: joinedGroupsCount,
      totalAmountSent: totalSentAmount?.total || '0',
      totalAmountReceived: totalReceivedAmount?.total || '0',
      activeGroups: await groupRepo.count({
        where: { creatorAddress: address, isPaid: false }
      }),
      completedGroups: await groupRepo.count({
        where: { creatorAddress: address, isPaid: true }
      })
    };

    res.json({ data: stats });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ error: { message: 'Failed to get user stats' } });
  }
});

export { router as userRoutes }; 