import { io, Socket } from 'socket.io-client';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    Room,
    GameState,
    Player,
    ChatMessage,
    ExplosionStep,
    RoomSettings,
} from '../../../shared/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
    private socket: TypedSocket | null = null;
    private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

    /**
     * Connect to the Socket.IO server
     */
    connect() {
        if (this.socket?.connected) return;

        const serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        return this.socket;
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.listeners.clear();
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get socket ID
     */
    getSocketId(): string | undefined {
        return this.socket?.id;
    }

    // ============ Event Emitters ============

    /**
     * Create a new room
     */
    createRoom(
        playerName: string,
        settings: RoomSettings,
        callback: (response: { success: boolean; roomCode?: string; error?: string }) => void
    ) {
        this.socket?.emit('create-room', playerName, settings, callback);
    }

    /**
     * Join an existing room
     */
    joinRoom(
        roomCode: string,
        playerName: string,
        callback: (response: { success: boolean; error?: string }) => void
    ) {
        this.socket?.emit('join-room', roomCode, playerName, callback);
    }

    /**
     * Leave the current room
     */
    leaveRoom() {
        this.socket?.emit('leave-room');
    }

    /**
     * Toggle ready status
     */
    setPlayerReady(isReady: boolean) {
        this.socket?.emit('player-ready', isReady);
    }

    /**
     * Start the game (host only)
     */
    startGame() {
        this.socket?.emit('start-game');
    }

    /**
     * Place an orb on the board
     */
    placeOrb(row: number, col: number) {
        this.socket?.emit('place-orb', row, col);
    }

    /**
     * Send a chat message
     */
    sendMessage(message: string) {
        this.socket?.emit('send-message', message);
    }

    // ============ Event Listeners ============

    /**
     * Listen for room updates
     */
    onRoomUpdated(callback: (room: Room) => void) {
        this.on('room-updated', callback);
    }

    /**
     * Listen for game state updates
     */
    onGameStateUpdated(callback: (gameState: GameState) => void) {
        this.on('game-state-updated', callback);
    }

    /**
     * Listen for player joined events
     */
    onPlayerJoined(callback: (player: Player) => void) {
        this.on('player-joined', callback);
    }

    /**
     * Listen for player left events
     */
    onPlayerLeft(callback: (playerId: string) => void) {
        this.on('player-left', callback);
    }

    /**
     * Listen for game started events
     */
    onGameStarted(callback: () => void) {
        this.on('game-started', callback);
    }

    /**
     * Listen for game over events
     */
    onGameOver(callback: (winnerId: string) => void) {
        this.on('game-over', callback);
    }

    /**
     * Listen for chat messages
     */
    onChatMessage(callback: (message: ChatMessage) => void) {
        this.on('chat-message', callback);
    }

    /**
     * Listen for errors
     */
    onError(callback: (message: string) => void) {
        this.on('error', callback);
    }

    /**
     * Listen for turn changes
     */
    onTurnChanged(callback: (playerId: string) => void) {
        this.on('turn-changed', callback);
    }

    /**
     * Listen for explosion sequences (for animations)
     */
    onExplosionSequence(callback: (sequence: ExplosionStep[]) => void) {
        this.on('explosion-sequence', callback);
    }

    // ============ Internal Listener Management ============

    /**
     * Generic event listener
     */
    private on<T extends keyof ServerToClientEvents>(
        event: T,
        callback: ServerToClientEvents[T]
    ) {
        if (!this.socket) {
            console.warn('Socket not connected, cannot add listener');
            return;
        }

        // Store listener for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback as any);

        // Add to socket
        this.socket.on(event, callback as any);
    }

    /**
     * Remove specific event listener
     */
    off<T extends keyof ServerToClientEvents>(
        event: T,
        callback: ServerToClientEvents[T]
    ) {
        if (!this.socket) return;

        this.socket.off(event, callback as any);
        this.listeners.get(event)?.delete(callback as any);
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners<T extends keyof ServerToClientEvents>(event?: T) {
        if (!this.socket) return;

        if (event) {
            this.socket.removeAllListeners(event);
            this.listeners.delete(event);
        } else {
            this.socket.removeAllListeners();
            this.listeners.clear();
        }
    }
}

// Export singleton instance
export const socketService = new SocketService();
