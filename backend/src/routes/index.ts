import { Express } from 'express';
import { groupRoutes } from './groupRoutes';
import { userRoutes } from './userRoutes';
import { paymentRoutes } from './paymentRoutes';
import { metricsRoutes } from './metricsRoutes';
import { webhookRoutes } from './webhookRoutes';

export const setupRoutes = (app: Express): void => {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Health check (already defined in index.ts)
  
  // API routes
  app.use(`${apiPrefix}/groups`, groupRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/payments`, paymentRoutes);
  app.use(`${apiPrefix}/metrics`, metricsRoutes);
  app.use(`${apiPrefix}/webhooks`, webhookRoutes);

  // 404 handler for API routes
  app.use(`${apiPrefix}/*`, (req, res) => {
    res.status(404).json({
      error: {
        message: 'API endpoint not found',
        statusCode: 404
      }
    });
  });
}; 