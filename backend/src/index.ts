import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
} from '../../shared/types';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';
import { validateEnvironment } from './utils/validators';
import { logger } from './utils/logger';
import { cleanupOldRooms } from './services/roomManager';

// Load environment variables
dotenv.config();

// Validate environment variables
try {
    validateEnvironment();
    logger.info('Environment variables validated successfully');
} catch (error) {
    logger.error('Environment validation failed:', error);
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with TypeScript types and secure CORS
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

//ping
app.get('/ping', (req, res) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// CORS - Restrict to frontend URL only
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST'],
    })
);

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Track connections per IP to prevent DOS attacks
const connectionsPerIP = new Map<string, number>();

// Socket.IO connection handler with IP-based rate limiting
io.use((socket, next) => {
    const ip = socket.handshake.address;
    const count = connectionsPerIP.get(ip) || 0;

    if (count >= 10) {
        logger.warn(`Connection limit exceeded for IP: ${ip}`);
        return next(new Error('Too many connections from this IP'));
    }

    connectionsPerIP.set(ip, count + 1);
    logger.debug(`IP ${ip} now has ${count + 1} connections`);

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        const current = connectionsPerIP.get(ip) || 0;
        connectionsPerIP.set(ip, Math.max(0, current - 1));
        logger.debug(`IP ${ip} now has ${Math.max(0, current - 1)} connections`);
    });

    next();
});

io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);

    // Initialize socket data
    socket.data.playerId = socket.id;
    socket.data.roomCode = '';

    // Register all event handlers
    registerRoomHandlers(socket, io);
    registerGameHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        // Cleanup is handled in roomHandlers disconnect event
    });
});

// Periodic room cleanup - every hour
setInterval(
    () => {
        const deleted = cleanupOldRooms(24 * 60 * 60 * 1000); // 24 hours
        if (deleted > 0) {
            logger.info(`Cleaned up ${deleted} old rooms`);
        }
    },
    60 * 60 * 1000
);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 WebSocket server ready`);
    logger.info(`🔒 Security features enabled: CORS, Rate Limiting, Helmet`);
    logger.info(`🌐 Accepting connections from: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export { io };
