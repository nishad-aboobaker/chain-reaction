import type { Socket } from 'socket.io';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
    ChatMessage,
} from '../../../shared/types';
import {
    getRoom,
    startGame,
    updateGameState,
    updatePlayers,
} from '../services/roomManager';
import {
    isValidMove,
    placeOrb,
    checkPlayerElimination,
    checkWinCondition,
    nextTurn,
} from '../services/gameLogic';
import { sanitizeInput } from '../utils/validators';
import { socketRateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

type TypedSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

/**
 * Register game-related event handlers
 */
export function registerGameHandlers(socket: TypedSocket, io: any) {
    // Start game
    socket.on('start-game', () => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) {
            socket.emit('error', 'Not in a room');
            return;
        }

        try {
            const result = startGame(roomCode, playerId);

            if (!result.success) {
                socket.emit('error', result.error || 'Failed to start game');
                return;
            }

            // Notify all players that game started
            io.to(roomCode).emit('room-updated', result.room!);
            io.to(roomCode).emit('game-started');
            io.to(roomCode).emit('game-state-updated', result.room!.gameState!);

            // Notify current turn
            const currentPlayer = result.room!.players[result.room!.gameState!.currentTurnIndex];
            io.to(roomCode).emit('turn-changed', currentPlayer.id);

            console.log(`Game started in room: ${roomCode}`);
        } catch (error) {
            console.error('Error starting game:', error);
            socket.emit('error', 'Failed to start game');
        }
    });

    // Place orb with rate limiting
    socket.on('place-orb', (row: number, col: number) => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) {
            socket.emit('error', 'Not in a room');
            return;
        }

        // Rate limit: 30 moves per minute
        if (!socketRateLimiter.checkLimit(playerId, 'place-orb', 30)) {
            socket.emit('error', 'Too many moves, please slow down');
            return;
        }

        try {
            const room = getRoom(roomCode);

            if (!room || !room.gameState) {
                socket.emit('error', 'Game not started');
                return;
            }

            // Check if it's player's turn
            const currentPlayer = room.players[room.gameState.currentTurnIndex];
            if (currentPlayer.id !== playerId) {
                socket.emit('error', 'Not your turn');
                return;
            }

            // Validate move
            const validation = isValidMove(
                room.gameState.grid,
                row,
                col,
                playerId,
                room.gameState.roundNumber
            );

            if (!validation.valid) {
                socket.emit('error', 'Invalid move');
                logger.warn(`Invalid move attempt from ${playerId}: ${validation.error}`);
                return;
            }

            // Place orb and get explosion sequence
            const { gameState: newGameState, explosionSequence } = placeOrb(
                room.gameState,
                row,
                col,
                playerId
            );

            // Check for player elimination
            const updatedPlayers = checkPlayerElimination(newGameState, room.players);
            updatePlayers(roomCode, updatedPlayers);

            // Check win condition
            const { isGameOver, winnerId } = checkWinCondition(newGameState, updatedPlayers);

            if (isGameOver && winnerId) {
                newGameState.isGameOver = true;
                newGameState.winnerId = winnerId;
                updateGameState(roomCode, newGameState);

                // Get final room state
                const finalRoom = getRoom(roomCode);

                // Notify game over
                io.to(roomCode).emit('game-state-updated', newGameState);
                io.to(roomCode).emit('room-updated', finalRoom!);
                io.to(roomCode).emit('game-over', winnerId);

                console.log(`Game over in room ${roomCode}, winner: ${winnerId}`);
                return;
            }

            // Advance turn
            const { currentTurnIndex, roundNumber } = nextTurn(newGameState, updatedPlayers);
            newGameState.currentTurnIndex = currentTurnIndex;
            newGameState.roundNumber = roundNumber;
            newGameState.turnStartTime = Date.now();

            // Update game state
            updateGameState(roomCode, newGameState);

            // Get updated room
            const updatedRoom = getRoom(roomCode);

            // Emit explosion sequence for animations
            if (explosionSequence.length > 0) {
                io.to(roomCode).emit('explosion-sequence', explosionSequence);
            }

            // Emit updated game state
            io.to(roomCode).emit('game-state-updated', newGameState);
            io.to(roomCode).emit('room-updated', updatedRoom!);

            // Emit turn change
            const nextPlayer = updatedPlayers[currentTurnIndex];
            io.to(roomCode).emit('turn-changed', nextPlayer.id);

            console.log(`Move made in room ${roomCode} at (${row}, ${col}) by ${playerId}`);
        } catch (error) {
            console.error('Error placing orb:', error);
            socket.emit('error', 'Failed to place orb');
        }
    });

    // Send chat message with sanitization and rate limiting
    socket.on('send-message', (message: string) => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) return;

        // Rate limit: 10 messages per minute
        if (!socketRateLimiter.checkLimit(playerId, 'send-message', 10)) {
            socket.emit('error', 'Too many messages, please slow down');
            return;
        }

        try {
            const room = getRoom(roomCode);
            if (!room) return;

            const player = room.players.find(p => p.id === playerId);
            if (!player) return;

            const chatMessage: ChatMessage = {
                id: `${Date.now()}-${playerId}`,
                playerId,
                playerName: player.name,
                message: sanitizeInput(message), // Sanitize to prevent XSS
                timestamp: Date.now(),
                isSystem: false,
            };

            io.to(roomCode).emit('chat-message', chatMessage);

            console.log(`Chat in room ${roomCode} from ${player.name}: ${message}`);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
}
