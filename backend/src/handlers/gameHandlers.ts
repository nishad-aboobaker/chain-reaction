import type { Socket, Server } from 'socket.io';
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
    resetGame,
    startTurnTimer,
    clearTurnTimer,
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

type TypedServer = Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

/**
 * Handle turn timer expiry — advance to next player
 */
function onTurnTimerExpired(roomCode: string, io: TypedServer): void {
    logger.info(`Turn timer expired in room ${roomCode}, skipping turn`);
    const currentRoom = getRoom(roomCode);
    if (!currentRoom || !currentRoom.gameState) return;

    const { currentTurnIndex: nextIdx, roundNumber: nextRound } = nextTurn(
        currentRoom.gameState,
        currentRoom.players
    );
    currentRoom.gameState.currentTurnIndex = nextIdx;
    currentRoom.gameState.roundNumber = nextRound;
    currentRoom.gameState.turnStartTime = Date.now();
    updateGameState(roomCode, currentRoom.gameState);

    const updatedRoom = getRoom(roomCode);
    io.to(roomCode).emit('game-state-updated', currentRoom.gameState);
    io.to(roomCode).emit('room-updated', updatedRoom!);

    const nextPlayer = currentRoom.players[nextIdx];
    io.to(roomCode).emit('turn-changed', nextPlayer.id);

    // Start timer for the next player
    startTurnTimer(roomCode, () => onTurnTimerExpired(roomCode, io));
}

/**
 * Register game-related event handlers
 */
export function registerGameHandlers(socket: TypedSocket, io: TypedServer) {
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

            // Start turn timer for first player
            startTurnTimer(roomCode, () => onTurnTimerExpired(roomCode, io));

            logger.info(`Game started in room: ${roomCode}`);
        } catch (error) {
            logger.error('Error starting game:', error);
            socket.emit('error', 'Failed to start game');
        }
    });

    // Play again (Reset game and return to lobby)
    socket.on('play-again', () => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) {
            socket.emit('error', 'Not in a room');
            return;
        }

        try {
            const room = getRoom(roomCode);
            if (!room) {
                socket.emit('error', 'Room not found');
                return;
            }

            if (room.hostId !== playerId) {
                socket.emit('error', 'Only host can restart the game');
                return;
            }

            const result = resetGame(roomCode);
            if (result.success && result.room) {
                io.to(roomCode).emit('room-updated', result.room);
                logger.info(`Game reset for replay in room: ${roomCode}`);
            }
        } catch (error) {
            logger.error('Error resetting game for play-again:', error);
            socket.emit('error', 'Failed to restart game');
        }
    });

    // Place orb or XOX symbol with rate limiting
    socket.on('place-orb', (row: number, col: number) => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) {
            socket.emit('error', 'Not in a room');
            return;
        }

        if (!socketRateLimiter.checkLimit(playerId, 'place-orb', 60)) {
            socket.emit('error', 'Too many moves, please slow down');
            return;
        }

        try {
            const room = getRoom(roomCode);

            if (!room || !room.gameState) {
                socket.emit('error', 'Game not started');
                return;
            }

            const currentPlayer = room.players[room.gameState.currentTurnIndex];
            if (currentPlayer.id !== playerId) {
                socket.emit('error', 'Not your turn');
                return;
            }

            const gameMode = room.settings.gameMode || 'CHAIN_REACTION';

            // Validate move
            const validation = isValidMove(
                room.gameState.grid,
                row,
                col,
                playerId,
                gameMode
            );

            if (!validation.valid) {
                socket.emit('error', validation.error || 'Invalid move');
                return;
            }

            // Place move
            const { gameState: newGameState, explosionSequence } = placeOrb(
                room.gameState,
                row,
                col,
                playerId,
                currentPlayer.symbol,
                gameMode
            );

            // Clear turn timer on move
            clearTurnTimer(roomCode);

            // Check win/gameover condition
            if (gameMode === 'XOX') {
                if (newGameState.isGameOver) {
                    updateGameState(roomCode, newGameState);
                    const finalRoom = getRoom(roomCode);
                    io.to(roomCode).emit('game-state-updated', newGameState);
                    io.to(roomCode).emit('room-updated', finalRoom!);
                    io.to(roomCode).emit('game-over', newGameState.winnerId || (newGameState.isDraw ? 'DRAW' : ''));
                    logger.info(`XOX Game over in room ${roomCode}, winner: ${newGameState.winnerId || 'DRAW'}`);
                    return;
                }
            } else {
                // Chain Reaction mode player elimination & win condition
                const updatedPlayers = checkPlayerElimination(newGameState, room.players);
                updatePlayers(roomCode, updatedPlayers);

                const { isGameOver, winnerId } = checkWinCondition(newGameState, updatedPlayers);

                if (isGameOver && winnerId) {
                    newGameState.isGameOver = true;
                    newGameState.winnerId = winnerId;
                    updateGameState(roomCode, newGameState);

                    const finalRoom = getRoom(roomCode);
                    io.to(roomCode).emit('game-state-updated', newGameState);
                    io.to(roomCode).emit('room-updated', finalRoom!);
                    io.to(roomCode).emit('game-over', winnerId);
                    logger.info(`Chain Reaction Game over in room ${roomCode}, winner: ${winnerId}`);
                    return;
                }
            }

            // Advance turn
            const { currentTurnIndex, roundNumber } = nextTurn(newGameState, room.players);
            newGameState.currentTurnIndex = currentTurnIndex;
            newGameState.roundNumber = roundNumber;
            newGameState.turnStartTime = Date.now();

            // Update game state
            updateGameState(roomCode, newGameState);

            // Start turn timer for next player
            startTurnTimer(roomCode, () => onTurnTimerExpired(roomCode, io));

            const updatedRoom = getRoom(roomCode);

            if (explosionSequence.length > 0) {
                io.to(roomCode).emit('explosion-sequence', explosionSequence);
            }

            io.to(roomCode).emit('game-state-updated', newGameState);
            io.to(roomCode).emit('room-updated', updatedRoom!);

            const nextPlayer = room.players[currentTurnIndex];
            io.to(roomCode).emit('turn-changed', nextPlayer.id);

            logger.info(`Move made in room ${roomCode} at (${row}, ${col}) by ${playerId}`);
        } catch (error) {
            logger.error('Error placing orb:', error);
            socket.emit('error', 'Failed to place move');
        }
    });

    // Send chat message with sanitization and rate limiting
    socket.on('send-message', (message: string) => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;

        if (!roomCode || !playerId) return;

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
                message: sanitizeInput(message),
                timestamp: Date.now(),
                isSystem: false,
            };

            io.to(roomCode).emit('chat-message', chatMessage);

            logger.info(`Chat in room ${roomCode} from ${player.name}: ${message}`);
        } catch (error) {
            logger.error('Error sending message:', error);
        }
    });
}
