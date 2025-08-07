import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';

interface Client {
  ws: WebSocket;
  userId?: string;
  address?: string;
}

const clients = new Map<string, Client>();

export const setupWebSocket = (wss: WebSocketServer): void => {
  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = req.headers['x-client-id'] as string || Math.random().toString(36).substr(2, 9);
    
    clients.set(clientId, { ws });
    
    logger.info(`🔗 WebSocket client connected: ${clientId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to SwiftPay WebSocket server',
      clientId
    }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(clientId, message);
      } catch (error) {
        logger.error('WebSocket message parsing error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`🔌 WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });
  });

  logger.info('✅ WebSocket server initialized');
};

const handleWebSocketMessage = (clientId: string, message: any): void => {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
      // Subscribe to specific events
      if (message.userId) {
        client.userId = message.userId;
      }
      if (message.address) {
        client.address = message.address;
      }
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        message: 'Successfully subscribed to updates'
      }));
      break;

    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
};

// Broadcast to all clients
export const broadcastToAll = (data: any): void => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
};

// Broadcast to specific user
export const broadcastToUser = (userId: string, data: any): void => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
};

// Broadcast to specific address
export const broadcastToAddress = (address: string, data: any): void => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.address === address && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
};

// Get connected clients count
export const getConnectedClientsCount = (): number => {
  return clients.size;
}; 