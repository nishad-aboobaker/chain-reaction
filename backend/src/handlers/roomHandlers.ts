import type { Socket, Server } from 'socket.io';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
    RoomSettings,
} from '../../../shared/types';
import {
    createRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
    setPlayerReady,
    startGame,
    getRoom,
    shouldAutoStart,
    startTurnTimer,
    updateGameState,
} from '../services/roomManager';
import { nextTurn } from '../services/gameLogic';
import { socketRateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

type TypedSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

/**
 * Try to auto-start game if room conditions are met
 */
function tryAutoStart(roomCode: string, io: Server): void {
    const room = getRoom(roomCode);
    if (!room || !shouldAutoStart(room)) return;

    const result = startGame(roomCode, room.hostId);
    if (!result.success || !result.room) return;

    io.to(roomCode).emit('room-updated', result.room);
    io.to(roomCode).emit('game-started');
    io.to(roomCode).emit('game-state-updated', result.room.gameState!);

    const currentPlayer = result.room.players[result.room.gameState!.currentTurnIndex];
    io.to(roomCode).emit('turn-changed', currentPlayer.id);

    // Start turn timer if configured
    const roomSettings = result.room.settings;
    if (roomSettings.turnTimer) {
        startTurnTimer(roomCode, () => {
            logger.info(`Turn timer expired in room ${roomCode}, skipping turn`);
            const expiredRoom = getRoom(roomCode);
            if (!expiredRoom || !expiredRoom.gameState) return;

            const { currentTurnIndex: nextIdx, roundNumber: nextRound } =
                nextTurn(expiredRoom.gameState, expiredRoom.players);
            expiredRoom.gameState.currentTurnIndex = nextIdx;
            expiredRoom.gameState.roundNumber = nextRound;
            expiredRoom.gameState.turnStartTime = Date.now();
            updateGameState(roomCode, expiredRoom.gameState);

            const updatedRoom = getRoom(roomCode);
            io.to(roomCode).emit('game-state-updated', expiredRoom.gameState);
            io.to(roomCode).emit('room-updated', updatedRoom!);

            const nextPlayer = expiredRoom.players[nextIdx];
            io.to(roomCode).emit('turn-changed', nextPlayer.id);

            startTurnTimer(roomCode, () => {});
        });
    }

    logger.info(`Auto-started game in room: ${roomCode}`);
}

/**
 * Register room-related event handlers
 */
export function registerRoomHandlers(socket: TypedSocket, io: Server) {
    // Create room with rate limiting
    socket.on('create-room', (playerName: string, settings: RoomSettings, callback) => {
        try {
            // Rate limit: 5 room creations per minute
            if (!socketRateLimiter.checkLimit(socket.id, 'create-room', 5)) {
                callback({ success: false, error: 'Too many room creation attempts' });
                return;
            }

            const result = createRoom(socket.id, playerName, settings);

            if (!result.success || !result.room) {
                callback({ success: false, error: result.error });
                return;
            }

            const room = result.room;

            // Store room code in socket data
            socket.data.roomCode = room.code;
            socket.data.playerId = socket.id;

            // Join socket.io room
            socket.join(room.code);

            // Emit room update to creator
            socket.emit('room-updated', room);

            callback({ success: true, roomCode: room.code, playerToken: result.playerToken });

            logger.info(`Room created: ${room.code} by ${playerName}`);
        } catch (error) {
            logger.error('Error creating room:', error);
            callback({ success: false, error: 'Failed to create room' });
        }
    });

    // Join room with rate limiting
    socket.on('join-room', (roomCode: string, playerName: string, callback) => {
        try {
            // Rate limit: 10 join attempts per minute
            if (!socketRateLimiter.checkLimit(socket.id, 'join-room', 10)) {
                callback({ success: false, error: 'Too many join attempts' });
                return;
            }
            const result = addPlayerToRoom(roomCode.toUpperCase(), socket.id, playerName);

            if (!result.success) {
                callback({ success: false, error: result.error });
                return;
            }

            // Store room code in socket data
            socket.data.roomCode = roomCode.toUpperCase();
            socket.data.playerId = socket.id;

            // Join socket.io room
            socket.join(roomCode.toUpperCase());

            // Notify all players in room
            socket.to(roomCode.toUpperCase()).emit('room-updated', result.room!);
            socket.emit('room-updated', result.room!);

            // Notify others that a player joined
            const newPlayer = result.room!.players.find(p => p.id === socket.id);
            if (newPlayer) {
                socket.to(roomCode.toUpperCase()).emit('player-joined', newPlayer);
            }

            callback({ success: true, playerToken: result.playerToken });

            logger.info(`${playerName} joined room: ${roomCode.toUpperCase()}`);

            // Auto-start game if room is full and all players are ready
            tryAutoStart(roomCode.toUpperCase(), io);
        } catch (error) {
            logger.error('Error joining room:', error);
            callback({ success: false, error: 'Failed to join room' });
        }
    });

    // Leave room
    socket.on('leave-room', () => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) return;

        try {
            const result = removePlayerFromRoom(roomCode, playerId);

            if (result.success && !result.shouldDeleteRoom && result.room) {
                // Notify remaining players
                socket.to(roomCode).emit('room-updated', result.room);
                socket.to(roomCode).emit('player-left', playerId);
            }

            // Leave socket.io room
            socket.leave(roomCode);

            // Clear socket data
            socket.data.roomCode = '';
            socket.data.playerId = '';

            logger.info(`Player ${playerId} left room: ${roomCode}`);
        } catch (error) {
            logger.error('Error leaving room:', error);
        }
    });

    // Player ready toggle
    socket.on('player-ready', (isReady: boolean) => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) return;

        try {
            const result = setPlayerReady(roomCode, playerId, isReady);

            if (result.success && result.room) {
                // Notify all players in room
                socket.to(roomCode).emit('room-updated', result.room);
                socket.emit('room-updated', result.room);

                logger.info(`Player ${playerId} ready status: ${isReady}`);

                // Auto-start game if room is full and all players are ready
                tryAutoStart(roomCode, io);
            }
        } catch (error) {
            logger.error('Error setting player ready:', error);
        }
    });

    // Handle disconnection (cleanup)
    socket.on('disconnect', () => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) return;

        try {
            const result = removePlayerFromRoom(roomCode, playerId);

            if (result.success && !result.shouldDeleteRoom && result.room) {
                socket.to(roomCode).emit('room-updated', result.room);
                socket.to(roomCode).emit('player-left', playerId);
            }

            logger.info(`Player ${playerId} disconnected from room: ${roomCode}`);
        } catch (error) {
            logger.error('Error handling disconnect:', error);
        }
    });
}
