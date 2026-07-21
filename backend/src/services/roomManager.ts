import type { Room, Player, RoomSettings, GameState } from '../../../shared/types';
import { PLAYER_COLORS } from '../../../shared/types';
import { initializeGameState } from './gameLogic';

import crypto from 'crypto';
import { validatePlayerName } from '../utils/validators';

// In-memory storage for rooms
const rooms = new Map<string, Room>();

// Player tokens: token -> { playerId, roomCode }
const playerTokens = new Map<string, { playerId: string; roomCode: string }>();

// Turn timers: roomCode -> NodeJS.Timeout
const turnTimers = new Map<string, NodeJS.Timeout>();

/**
 * Generate a unique player identity token
 */
export function generatePlayerToken(): string {
    return crypto.randomUUID();
}

/**
 * Register a player token
 */
export function registerPlayerToken(token: string, playerId: string, roomCode: string): void {
    playerTokens.set(token, { playerId, roomCode });
}

/**
 * Validate a player token and return the associated player info
 */
export function validatePlayerToken(token: string): { playerId: string; roomCode: string } | null {
    return playerTokens.get(token) || null;
}

/**
 * Remove a player token
 */
export function removePlayerToken(token: string): void {
    playerTokens.delete(token);
}

/**
 * Remove all tokens for a given player in a room
 */
export function removePlayerTokens(playerId: string, roomCode: string): void {
    for (const [token, info] of playerTokens) {
        if (info.playerId === playerId && info.roomCode === roomCode) {
            playerTokens.delete(token);
        }
    }
}

/**
 * Generate a unique 6-character room code using cryptographically secure random
 */
function generateRoomCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters

    let code = '';
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = crypto.randomInt(0, characters.length);
            code += characters.charAt(randomIndex);
        }
    } while (rooms.has(code)); // Ensure uniqueness

    return code;
}

/**
 * Create a new room
 */
export function createRoom(
    hostId: string,
    hostName: string,
    settings: RoomSettings
): { success: boolean; room?: Room; playerToken?: string; error?: string } {
    // Validate player name
    const nameValidation = validatePlayerName(hostName);
    if (!nameValidation.valid) {
        return { success: false, error: nameValidation.error };
    }
    const code = generateRoomCode();

    const host: Player = {
        id: hostId,
        name: hostName,
        color: PLAYER_COLORS[0],
        isActive: true,
        isReady: false,
        isHost: true,
        orbCount: 0,
    };

    const room: Room = {
        id: code,
        code,
        hostId,
        players: [host],
        settings,
        gameState: null,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
    };

    const playerToken = generatePlayerToken();
    registerPlayerToken(playerToken, hostId, code);

    rooms.set(code, room);
    return { success: true, room, playerToken };
}

/**
 * Get room by code
 */
export function getRoom(code: string): Room | null {
    return rooms.get(code) || null;
}

/**
 * Add a player to a room
 */
export function addPlayerToRoom(
    code: string,
    playerId: string,
    playerName: string
): { success: boolean; room?: Room; playerToken?: string; error?: string } {
    // Validate player name
    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
        return { success: false, error: nameValidation.error };
    }
    const room = rooms.get(code);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    if (room.gameState !== null) {
        return { success: false, error: 'Game already in progress' };
    }

    if (room.players.length >= room.settings.maxPlayers) {
        return { success: false, error: 'Room is full' };
    }

    // Check if player already in room
    if (room.players.some(p => p.id === playerId)) {
        return { success: false, error: 'Already in room' };
    }

    // Add player with next available color
    const playerColor = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];

    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        color: playerColor,
        isActive: true,
        isReady: false,
        isHost: false,
        orbCount: 0,
    };

    const playerToken = generatePlayerToken();
    registerPlayerToken(playerToken, playerId, code);

    room.players.push(newPlayer);
    touchRoom(code);
    rooms.set(code, room);

    return { success: true, room, playerToken };
}

/**
 * Remove a player from a room
 */
export function removePlayerFromRoom(
    code: string,
    playerId: string
): { success: boolean; room?: Room; shouldDeleteRoom?: boolean; error?: string } {
    const room = rooms.get(code);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    // Remove player
    room.players = room.players.filter(p => p.id !== playerId);

    // Clean up tokens for this player
    removePlayerTokens(playerId, code);

    // If room is empty, mark for deletion
    if (room.players.length === 0) {
        // Clean up all tokens for this room
        for (const [token, info] of playerTokens) {
            if (info.roomCode === code) {
                playerTokens.delete(token);
            }
        }
        rooms.delete(code);
        return { success: true, shouldDeleteRoom: true };
    }

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
    }

    touchRoom(code);
    rooms.set(code, room);
    return { success: true, room };
}

/**
 * Set player ready status
 */
export function setPlayerReady(
    code: string,
    playerId: string,
    isReady: boolean
): { success: boolean; room?: Room; error?: string } {
    const room = rooms.get(code);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    const player = room.players.find(p => p.id === playerId);

    if (!player) {
        return { success: false, error: 'Player not in room' };
    }

    player.isReady = isReady;
    touchRoom(code);
    rooms.set(code, room);

    return { success: true, room };
}

/**
 * Start the game (must be called by host, all players must be ready)
 */
export function startGame(
    code: string,
    hostId: string
): { success: boolean; room?: Room; error?: string } {
    const room = rooms.get(code);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== hostId) {
        return { success: false, error: 'Only host can start game' };
    }

    if (room.players.length < 2) {
        return { success: false, error: 'Need at least 2 players to start' };
    }

    if (room.gameState !== null) {
        return { success: false, error: 'Game already started' };
    }

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
        return { success: false, error: 'All players must be ready' };
    }

    // Initialize game state
    room.gameState = initializeGameState(room.players, room.settings.gridSize);
    touchRoom(code);
    rooms.set(code, room);

    return { success: true, room };
}

/**
 * Check if auto-start conditions are met (room full + all ready)
 */
export function shouldAutoStart(room: Room): boolean {
    return room.gameState === null &&
        room.players.length >= 2 &&
        room.players.length === room.settings.maxPlayers &&
        room.players.every(p => p.isReady);
}

/**
 * Update game state in room
 */
export function updateGameState(
    code: string,
    gameState: GameState
): { success: boolean; room?: Room; error?: string } {
    const room = rooms.get(code);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    room.gameState = gameState;
    touchRoom(code);
    rooms.set(code, room);

    return { success: true, room };
}

/**
 * Update players in room (for orb counts, elimination, etc.)
 */
export function updatePlayers(
    code: string,
    players: Player[]
): { success: boolean; room?: Room; error?: string } {
    const room = rooms.get(code);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    room.players = players;
    touchRoom(code);
    rooms.set(code, room);

    return { success: true, room };
}

/**
 * Get all active rooms (for debugging/admin)
 */
export function getAllRooms(): Room[] {
    return Array.from(rooms.values());
}

/**
 * Start a turn timer for a room. Auto-skips turn if player doesn't move in time.
 */
export function startTurnTimer(code: string, callback: () => void): void {
    clearTurnTimer(code);
    const room = rooms.get(code);
    if (!room || !room.settings.turnTimer) return;
    const timer = setTimeout(callback, room.settings.turnTimer * 1000);
    turnTimers.set(code, timer);
}

/**
 * Clear the turn timer for a room
 */
export function clearTurnTimer(code: string): void {
    const timer = turnTimers.get(code);
    if (timer) {
        clearTimeout(timer);
        turnTimers.delete(code);
    }
}

/**
 * Update last activity timestamp for a room
 */
function touchRoom(code: string): void {
    const room = rooms.get(code);
    if (room) {
        room.lastActivityAt = Date.now();
    }
}

/**
 * Clean up old rooms (can be called periodically)
 */
export function cleanupOldRooms(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [code, room] of rooms.entries()) {
        if (now - room.lastActivityAt > maxAgeMs) {
            rooms.delete(code);
            deletedCount++;
        }
    }

    return deletedCount;
}
