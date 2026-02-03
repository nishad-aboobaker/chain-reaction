import type { Room, Player, RoomSettings, GameState } from '../../../shared/types';
import { PLAYER_COLORS } from '../../../shared/types';
import { initializeGameState } from './gameLogic';

import crypto from 'crypto';
import { validatePlayerName } from '../utils/validators';

// In-memory storage for rooms
const rooms = new Map<string, Room>();

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
): { success: boolean; room?: Room; error?: string } {
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
    };

    rooms.set(code, room);
    return { success: true, room };
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
): { success: boolean; room?: Room; error?: string } {
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

    room.players.push(newPlayer);
    rooms.set(code, room);

    return { success: true, room };
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

    // If room is empty, mark for deletion
    if (room.players.length === 0) {
        rooms.delete(code);
        return { success: true, shouldDeleteRoom: true };
    }

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
    }

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

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
        return { success: false, error: 'All players must be ready' };
    }

    // Initialize game state
    room.gameState = initializeGameState(room.players, room.settings.gridSize);
    rooms.set(code, room);

    return { success: true, room };
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
 * Clean up old rooms (can be called periodically)
 */
export function cleanupOldRooms(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [code, room] of rooms.entries()) {
        if (now - room.createdAt > maxAgeMs) {
            rooms.delete(code);
            deletedCount++;
        }
    }

    return deletedCount;
}
