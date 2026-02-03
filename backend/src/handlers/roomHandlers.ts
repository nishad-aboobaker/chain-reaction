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
} from '../services/roomManager';
import { socketRateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

type TypedSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

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

            callback({ success: true, roomCode: room.code });

            console.log(`Room created: ${room.code} by ${playerName}`);
        } catch (error) {
            console.error('Error creating room:', error);
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

            callback({ success: true });

            console.log(`${playerName} joined room: ${roomCode.toUpperCase()}`);

            // Auto-start game if room is full and all players are ready
            if (result.room!.players.length === result.room!.settings.maxPlayers) {
                const allReady = result.room!.players.every(p => p.isReady);

                if (allReady) {
                    console.log(`Room ${roomCode.toUpperCase()} is full and all ready, auto-starting game...`);

                    const startResult = startGame(roomCode.toUpperCase(), result.room!.hostId);

                    if (startResult.success && startResult.room) {
                        // Notify all players that game started
                        io.to(roomCode.toUpperCase()).emit('room-updated', startResult.room);
                        io.to(roomCode.toUpperCase()).emit('game-started');
                        io.to(roomCode.toUpperCase()).emit('game-state-updated', startResult.room.gameState!);

                        // Notify current turn
                        const currentPlayer = startResult.room.players[startResult.room.gameState!.currentTurnIndex];
                        io.to(roomCode.toUpperCase()).emit('turn-changed', currentPlayer.id);

                        console.log(`Auto-started game in room: ${roomCode.toUpperCase()}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error joining room:', error);
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

            console.log(`Player ${playerId} left room: ${roomCode}`);
        } catch (error) {
            console.error('Error leaving room:', error);
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

                console.log(`Player ${playerId} ready status: ${isReady}`);

                // Auto-start game if room is full and all players are ready
                if (result.room.players.length === result.room.settings.maxPlayers) {
                    const allReady = result.room.players.every(p => p.isReady);

                    if (allReady) {
                        console.log(`Room ${roomCode} is full and all ready, auto-starting game...`);

                        const startResult = startGame(roomCode, result.room.hostId);

                        if (startResult.success && startResult.room) {
                            // Notify all players that game started
                            io.to(roomCode).emit('room-updated', startResult.room);
                            io.to(roomCode).emit('game-started');
                            io.to(roomCode).emit('game-state-updated', startResult.room.gameState!);

                            // Notify current turn
                            const currentPlayer = startResult.room.players[startResult.room.gameState!.currentTurnIndex];
                            io.to(roomCode).emit('turn-changed', currentPlayer.id);

                            console.log(`Auto-started game in room: ${roomCode}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error setting player ready:', error);
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

            console.log(`Player ${playerId} disconnected from room: ${roomCode}`);
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
}
