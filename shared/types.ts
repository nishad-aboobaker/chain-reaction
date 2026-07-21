// Player Colors
export const PLAYER_COLORS = [
    '#EF4444', // red
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#A855F7', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#EC4899', // pink
] as const;

// Grid Sizes
export const GRID_SIZES = {
    SMALL: { rows: 5, cols: 7 },
    MEDIUM: { rows: 6, cols: 9 },
    LARGE: { rows: 7, cols: 11 },
} as const;

// Player Interface
export interface Player {
    id: string;
    name: string;
    color: string;
    isActive: boolean;
    isReady: boolean;
    isHost: boolean;
    orbCount: number;
}

// Cell Interface
export interface Cell {
    row: number;
    col: number;
    orbCount: number;
    ownerId: string | null;
    criticalMass: number;
}

// Grid Interface
export interface Grid {
    rows: number;
    cols: number;
    cells: Cell[][];
}

// Room Settings
export interface RoomSettings {
    gridSize: keyof typeof GRID_SIZES;
    maxPlayers: number;
    turnTimer: number | null; // seconds, null for no timer
}

// Room Interface
export interface Room {
    id: string;
    code: string;
    hostId: string;
    players: Player[];
    settings: RoomSettings;
    gameState: GameState | null;
    createdAt: number;
    lastActivityAt: number;
}

// Game State
export interface GameState {
    grid: Grid;
    currentTurnIndex: number;
    roundNumber: number;
    isGameOver: boolean;
    winnerId: string | null;
    turnStartTime: number | null;
}

// Chat Message
export interface ChatMessage {
    id: string;
    playerId: string | null; // null for system messages
    playerName: string;
    message: string;
    timestamp: number;
    isSystem: boolean;
}

// Socket Events (Client -> Server)
export interface ClientToServerEvents {
    'create-room': (playerName: string, settings: RoomSettings, callback: (response: { success: boolean; roomCode?: string; playerToken?: string; error?: string }) => void) => void;
    'join-room': (roomCode: string, playerName: string, callback: (response: { success: boolean; playerToken?: string; error?: string }) => void) => void;
    'leave-room': () => void;
    'player-ready': (isReady: boolean) => void;
    'start-game': () => void;
    'place-orb': (row: number, col: number) => void;
    'send-message': (message: string) => void;
}

// Socket Events (Server -> Client)
export interface ServerToClientEvents {
    'room-updated': (room: Room) => void;
    'game-state-updated': (gameState: GameState) => void;
    'player-joined': (player: Player) => void;
    'player-left': (playerId: string) => void;
    'game-started': () => void;
    'game-over': (winnerId: string) => void;
    'chat-message': (message: ChatMessage) => void;
    'error': (message: string) => void;
    'turn-changed': (playerId: string) => void;
    'explosion-sequence': (sequence: ExplosionStep[]) => void;
}

// Explosion Step (for animations)
export interface ExplosionStep {
    row: number;
    col: number;
    type: 'add' | 'explode';
    ownerId: string;
    delay: number; // milliseconds
}

// Inter-server Events (for scaling)
export interface InterServerEvents {
    ping: () => void;
}

// Socket Data
export interface SocketData {
    playerId: string;
    roomCode: string;
}
