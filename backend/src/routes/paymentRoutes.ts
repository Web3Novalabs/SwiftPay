import { Router, Request, Response } from 'express';
import { param, query, body, validationResult } from 'express-validator';
import { Between } from 'typeorm';
import { Payment } from '../entities/Payment';
import { Group } from '../entities/Group';
import { User } from '../entities/User';
import { logger } from '../utils/logger';
import { getRepository } from '../config/database';

const router = Router();

// Get all payments
router.get('/', [
  query('status').optional().isIn(['pending', 'completed', 'failed']),
  query('group').optional().isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, group, page = 1, limit = 20 } = req.query;
    
    const paymentRepo = getRepository(Payment);
    const queryBuilder = paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.group', 'group')
      .leftJoinAndSelect('payment.fromUser', 'fromUser')
      .leftJoinAndSelect('payment.toUser', 'toUser')
      .orderBy('payment.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (group) {
      queryBuilder.andWhere('payment.groupId = :groupId', { groupId: group });
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
    logger.error('Error getting payments:', error);
    res.status(500).json({ error: { message: 'Failed to get payments' } });
  }
});

// Get payment by ID
router.get('/:id', [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const paymentRepo = getRepository(Payment);
    
    const payment = await paymentRepo.findOne({
      where: { id },
      relations: ['group', 'fromUser', 'toUser']
    });

    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    res.json({ data: payment });
  } catch (error) {
    logger.error('Error getting payment:', error);
    res.status(500).json({ error: { message: 'Failed to get payment' } });
  }
});

// Get payment statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const paymentRepo = getRepository(Payment);
    
    const totalPayments = await paymentRepo.count();
    const completedPayments = await paymentRepo.count({ where: { status: 'completed' } });
    const pendingPayments = await paymentRepo.count({ where: { status: 'pending' } });
    const failedPayments = await paymentRepo.count({ where: { status: 'failed' } });

    const totalAmount = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(CAST(payment.amount AS DECIMAL))', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPayments = await paymentRepo.count({
      where: {
        createdAt: Between(today, tomorrow)
      }
    });

    const stats = {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount?.total || '0',
      todayPayments,
      successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
    };

    res.json({ data: stats });
  } catch (error) {
    logger.error('Error getting payment stats:', error);
    res.status(500).json({ error: { message: 'Failed to get payment stats' } });
  }
});

// Get payments by group
router.get('/group/:groupId', [
  param('groupId').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.params;
    const paymentRepo = getRepository(Payment);
    
    const payments = await paymentRepo.find({
      where: { groupId },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' }
    });

    res.json({ data: payments });
  } catch (error) {
    logger.error('Error getting group payments:', error);
    res.status(500).json({ error: { message: 'Failed to get group payments' } });
  }
});

// Update payment status (for webhook processing)
router.put('/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['pending', 'completed', 'failed']),
  body('transactionHash').optional().isString(),
  body('blockNumber').optional().isNumeric(),
  body('errorMessage').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, transactionHash, blockNumber, errorMessage } = req.body;
    
    const paymentRepo = getRepository(Payment);
    const payment = await paymentRepo.findOne({ where: { id } });

    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    // Update payment status
    payment.status = status;
    if (transactionHash) payment.transactionHash = transactionHash;
    if (blockNumber) payment.blockNumber = blockNumber;
    if (errorMessage) payment.errorMessage = errorMessage;

    await paymentRepo.save(payment);

    // If payment completed, update user stats
    if (status === 'completed') {
      const userRepo = getRepository(User);
      
      // Update sender stats
      const sender = await userRepo.findOne({ where: { address: payment.fromAddress } });
      if (sender) {
        sender.totalAmountPaid = (BigInt(sender.totalAmountPaid || '0') + BigInt(payment.amount)).toString();
        await userRepo.save(sender);
      }

      // Update receiver stats
      const receiver = await userRepo.findOne({ where: { address: payment.toAddress } });
      if (receiver) {
        receiver.totalAmountReceived = (BigInt(receiver.totalAmountReceived || '0') + BigInt(payment.amount)).toString();
        await userRepo.save(receiver);
      }
    }

    res.json({ data: payment });
  } catch (error) {
    logger.error('Error updating payment status:', error);
    res.status(500).json({ error: { message: 'Failed to update payment status' } });
  }
});

// Get payment analytics
router.get('/analytics/trends', [
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
    const paymentRepo = getRepository(Payment);
    
    let dateFilter = '';
    const params: any = {};

    if (startDate && endDate) {
      dateFilter = 'AND payment.createdAt BETWEEN :startDate AND :endDate';
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
      
      dateFilter = 'AND payment.createdAt >= :startDate';
      params.startDate = start;
    }

    // Get payment trends
    const trends = await paymentRepo
      .createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(CAST(payment.amount AS DECIMAL))', 'totalAmount')
      .where(`payment.status = 'completed' ${dateFilter}`)
      .setParameters(params)
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get top senders and receivers
    const topSenders = await paymentRepo
      .createQueryBuilder('payment')
      .select('payment.fromAddress', 'address')
      .addSelect('SUM(CAST(payment.amount AS DECIMAL))', 'totalAmount')
      .addSelect('COUNT(*)', 'count')
      .where(`payment.status = 'completed' ${dateFilter}`)
      .setParameters(params)
      .groupBy('payment.fromAddress')
      .orderBy('totalAmount', 'DESC')
      .limit(10)
      .getRawMany();

    const topReceivers = await paymentRepo
      .createQueryBuilder('payment')
      .select('payment.toAddress', 'address')
      .addSelect('SUM(CAST(payment.amount AS DECIMAL))', 'totalAmount')
      .addSelect('COUNT(*)', 'count')
      .where(`payment.status = 'completed' ${dateFilter}`)
      .setParameters(params)
      .groupBy('payment.toAddress')
      .orderBy('totalAmount', 'DESC')
      .limit(10)
      .getRawMany();

    res.json({
      data: {
        trends,
        topSenders,
        topReceivers
      }
    });
  } catch (error) {
    logger.error('Error getting payment analytics:', error);
    res.status(500).json({ error: { message: 'Failed to get payment analytics' } });
  }
});

export { router as paymentRoutes }; 