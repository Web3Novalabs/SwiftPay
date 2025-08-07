import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { Between } from 'typeorm';
import { Group } from '../entities/Group';
import { User } from '../entities/User';
import { Payment } from '../entities/Payment';
import { Event } from '../entities/Event';
import { logger } from '../utils/logger';
import { getRepository } from '../config/database';

const router = Router();

// Get platform overview metrics
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const groupRepo = getRepository(Group);
    const userRepo = getRepository(User);
    const paymentRepo = getRepository(Payment);

    // Basic counts
    const totalGroups = await groupRepo.count();
    const totalUsers = await userRepo.count();
    const totalPayments = await paymentRepo.count();
    const activeGroups = await groupRepo.count({ where: { isPaid: false } });
    const completedGroups = await groupRepo.count({ where: { isPaid: true } });

    // Amount calculations
    const totalAmountProcessed = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(CAST(payment.amount AS DECIMAL))', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const totalFeesCollected = await paymentRepo
      .createQueryBuilder('payment')
      .select('COUNT(*) * 1000000000000000000000', 'total') // 1 STRK per group creation
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    // Recent activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayGroups = await groupRepo.count({
      where: {
        createdAt: Between(today, tomorrow)
      }
    });

    const todayPayments = await paymentRepo.count({
      where: {
        createdAt: Between(today, tomorrow)
      }
    });

    const todayUsers = await userRepo.count({
      where: {
        createdAt: Between(today, tomorrow)
      }
    });

    const overview = {
      totalGroups,
      totalUsers,
      totalPayments,
      activeGroups,
      completedGroups,
      totalAmountProcessed: totalAmountProcessed?.total || '0',
      totalFeesCollected: totalFeesCollected?.total || '0',
      todayGroups,
      todayPayments,
      todayUsers,
      successRate: totalPayments > 0 ? (completedGroups / totalGroups) * 100 : 0
    };

    res.json({ data: overview });
  } catch (error) {
    logger.error('Error getting overview metrics:', error);
    res.status(500).json({ error: { message: 'Failed to get overview metrics' } });
  }
});

// Get platform trends
router.get('/trends', [
  query('period').optional().isIn(['day', 'week', 'month', 'year']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { period = 'month', startDate, endDate } = req.query;
    const groupRepo = getRepository(Group);
    const userRepo = getRepository(User);
    const paymentRepo = getRepository(Payment);
    
    let dateFilter = '';
    const params: any = {};

    if (startDate && endDate) {
      dateFilter = 'AND entity.createdAt BETWEEN :startDate AND :endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    } else {
      // Default to last period
      const now = new Date();
      let start: Date;
      
      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      dateFilter = 'AND entity.createdAt >= :startDate';
      params.startDate = start;
    }

    // Group creation trends
    const groupTrends = await groupRepo
      .createQueryBuilder('entity')
      .select('DATE(entity.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(CAST(entity.amount AS DECIMAL))', 'totalAmount')
      .where(`1=1 ${dateFilter}`)
      .setParameters(params)
      .groupBy('DATE(entity.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // User registration trends
    const userTrends = await userRepo
      .createQueryBuilder('entity')
      .select('DATE(entity.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where(`1=1 ${dateFilter}`)
      .setParameters(params)
      .groupBy('DATE(entity.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Payment trends
    const paymentTrends = await paymentRepo
      .createQueryBuilder('entity')
      .select('DATE(entity.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(CAST(entity.amount AS DECIMAL))', 'totalAmount')
      .where(`entity.status = 'completed' ${dateFilter}`)
      .setParameters(params)
      .groupBy('DATE(entity.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    res.json({
      data: {
        groupTrends,
        userTrends,
        paymentTrends
      }
    });
  } catch (error) {
    logger.error('Error getting trends:', error);
    res.status(500).json({ error: { message: 'Failed to get trends' } });
  }
});

// Get top performers
router.get('/top-performers', [
  query('type').optional().isIn(['users', 'groups', 'payments']),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type = 'users', limit = 10 } = req.query;
    const userRepo = getRepository(User);
    const groupRepo = getRepository(Group);
    const paymentRepo = getRepository(Payment);

    let topPerformers: any = {};

    switch (type) {
      case 'users':
        // Top users by groups created
        const topCreators = await userRepo
          .createQueryBuilder('user')
          .select('user.address', 'address')
          .addSelect('user.username', 'username')
          .addSelect('user.totalGroupsCreated', 'groupsCreated')
          .addSelect('user.totalAmountPaid', 'totalPaid')
          .addSelect('user.totalAmountReceived', 'totalReceived')
          .orderBy('user.totalGroupsCreated', 'DESC')
          .limit(Number(limit))
          .getRawMany();

        // Top users by amount received
        const topReceivers = await userRepo
          .createQueryBuilder('user')
          .select('user.address', 'address')
          .addSelect('user.username', 'username')
          .addSelect('user.totalAmountReceived', 'totalReceived')
          .orderBy('user.totalAmountReceived', 'DESC')
          .limit(Number(limit))
          .getRawMany();

        topPerformers = {
          topCreators,
          topReceivers
        };
        break;

      case 'groups':
        // Largest groups by amount
        const largestGroups = await groupRepo
          .createQueryBuilder('group')
          .select('group.name', 'name')
          .addSelect('group.amount', 'amount')
          .addSelect('group.memberCount', 'memberCount')
          .addSelect('group.creatorAddress', 'creatorAddress')
          .orderBy('CAST(group.amount AS DECIMAL)', 'DESC')
          .limit(Number(limit))
          .getRawMany();

        // Most active groups (by member count)
        const mostActiveGroups = await groupRepo
          .createQueryBuilder('group')
          .select('group.name', 'name')
          .addSelect('group.memberCount', 'memberCount')
          .addSelect('group.amount', 'amount')
          .addSelect('group.creatorAddress', 'creatorAddress')
          .orderBy('group.memberCount', 'DESC')
          .limit(Number(limit))
          .getRawMany();

        topPerformers = {
          largestGroups,
          mostActiveGroups
        };
        break;

      case 'payments':
        // Largest payments
        const largestPayments = await paymentRepo
          .createQueryBuilder('payment')
          .select('payment.amount', 'amount')
          .addSelect('payment.fromAddress', 'fromAddress')
          .addSelect('payment.toAddress', 'toAddress')
          .addSelect('payment.createdAt', 'date')
          .orderBy('CAST(payment.amount AS DECIMAL)', 'DESC')
          .limit(Number(limit))
          .getRawMany();

        // Most frequent payers
        const frequentPayers = await paymentRepo
          .createQueryBuilder('payment')
          .select('payment.fromAddress', 'address')
          .addSelect('COUNT(*)', 'paymentCount')
          .addSelect('SUM(CAST(payment.amount AS DECIMAL))', 'totalAmount')
          .where('payment.status = :status', { status: 'completed' })
          .groupBy('payment.fromAddress')
          .orderBy('paymentCount', 'DESC')
          .limit(Number(limit))
          .getRawMany();

        topPerformers = {
          largestPayments,
          frequentPayers
        };
        break;
    }

    res.json({ data: topPerformers });
  } catch (error) {
    logger.error('Error getting top performers:', error);
    res.status(500).json({ error: { message: 'Failed to get top performers' } });
  }
});

// Get blockchain events metrics
router.get('/blockchain-events', [
  query('eventType').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventType, startDate, endDate } = req.query;
    const eventRepo = getRepository(Event);
    
    let whereClause = '1=1';
    const params: any = {};

    if (eventType) {
      whereClause += ' AND event.eventType = :eventType';
      params.eventType = eventType;
    }

    if (startDate && endDate) {
      whereClause += ' AND event.createdAt BETWEEN :startDate AND :endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }

    // Event counts by type
    const eventCounts = await eventRepo
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where(whereClause)
      .setParameters(params)
      .groupBy('event.eventType')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Events by date
    const eventsByDate = await eventRepo
      .createQueryBuilder('event')
      .select('DATE(event.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where(whereClause)
      .setParameters(params)
      .groupBy('DATE(event.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Processing status
    const processedEvents = await eventRepo.count({
      where: { isProcessed: true }
    });

    const unprocessedEvents = await eventRepo.count({
      where: { isProcessed: false }
    });

    res.json({
      data: {
        eventCounts,
        eventsByDate,
        processedEvents,
        unprocessedEvents,
        processingRate: (processedEvents + unprocessedEvents) > 0 
          ? (processedEvents / (processedEvents + unprocessedEvents)) * 100 
          : 0
      }
    });
  } catch (error) {
    logger.error('Error getting blockchain events metrics:', error);
    res.status(500).json({ error: { message: 'Failed to get blockchain events metrics' } });
  }
});

// Get real-time metrics
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const groupRepo = getRepository(Group);
    const paymentRepo = getRepository(Payment);
    const userRepo = getRepository(User);

    // Last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const groupsLast24h = await groupRepo.count({
      where: {
        createdAt: yesterday
      }
    });

    const paymentsLast24h = await paymentRepo.count({
      where: {
        createdAt: yesterday,
        status: 'completed'
      }
    });

    const usersLast24h = await userRepo.count({
      where: {
        createdAt: yesterday
      }
    });

    const amountLast24h = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(CAST(payment.amount AS DECIMAL))', 'total')
      .where('payment.createdAt >= :yesterday', { yesterday })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    // Active groups (not paid)
    const activeGroups = await groupRepo.count({
      where: { isPaid: false }
    });

    // Pending payments
    const pendingPayments = await paymentRepo.count({
      where: { status: 'pending' }
    });

    const realtime = {
      last24h: {
        groups: groupsLast24h,
        payments: paymentsLast24h,
        users: usersLast24h,
        amount: amountLast24h?.total || '0'
      },
      current: {
        activeGroups,
        pendingPayments
      }
    };

    res.json({ data: realtime });
  } catch (error) {
    logger.error('Error getting real-time metrics:', error);
    res.status(500).json({ error: { message: 'Failed to get real-time metrics' } });
  }
});

export { router as metricsRoutes }; 