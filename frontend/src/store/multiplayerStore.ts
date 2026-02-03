import { create } from 'zustand';
import type { Room, GameState, ChatMessage, Player, ExplosionStep } from '../../../shared/types';
import { socketService } from '../services/socketService';

interface MultiplayerGameStore {
    // State
    room: Room | null;
    gameState: GameState | null;
    chatMessages: ChatMessage[];
    currentPlayerId: string | null;
    error: string | null;
    explosionSequence: ExplosionStep[];

    // Actions
    initialize: () => void;
    cleanup: () => void;
    setRoom: (room: Room) => void;
    setGameState: (gameState: GameState) => void;
    addChatMessage: (message: ChatMessage) => void;
    setError: (error: string | null) => void;
    setExplosionSequence: (sequence: ExplosionStep[]) => void;
    clearExplosionSequence: () => void;

    // Computed
    getCurrentPlayer: () => Player | null;
    isMyTurn: () => boolean;
    isHost: () => boolean;
}

export const useMultiplayerStore = create<MultiplayerGameStore>((set, get) => ({
    // Initial state
    room: null,
    gameState: null,
    chatMessages: [],
    currentPlayerId: null,
    error: null,
    explosionSequence: [],

    // Initialize Socket.IO listeners
    initialize: () => {
        // Connect to server
        socketService.connect();

        // Store current player ID
        const socketId = socketService.getSocketId();
        if (socketId) {
            set({ currentPlayerId: socketId });
        }

        // Setup listeners
        socketService.onRoomUpdated((room) => {
            // Update current player ID from socket (in case it wasn't set during initialize)
            const socketId = socketService.getSocketId();
            if (socketId && !get().currentPlayerId) {
                set({ currentPlayerId: socketId });
            }
            set({ room });
        });

        socketService.onGameStateUpdated((gameState) => {
            set({ gameState });
        });

        socketService.onChatMessage((message) => {
            set((state) => ({
                chatMessages: [...state.chatMessages, message],
            }));
        });

        socketService.onError((errorMessage) => {
            set({ error: errorMessage });
            // Clear error after 5 seconds
            setTimeout(() => set({ error: null }), 5000);
        });

        socketService.onGameStarted(() => {
            console.log('Game started!');
        });

        socketService.onGameOver((winnerId) => {
            const room = get().room;
            if (room) {
                const winner = room.players.find(p => p.id === winnerId);
                const message: ChatMessage = {
                    id: `game-over-${Date.now()}`,
                    playerId: null,
                    playerName: 'System',
                    message: `Game Over! ${winner?.name || 'Unknown'} wins!`,
                    timestamp: Date.now(),
                    isSystem: true,
                };
                set((state) => ({
                    chatMessages: [...state.chatMessages, message],
                }));
            }
        });

        socketService.onPlayerJoined((player) => {
            const message: ChatMessage = {
                id: `joined-${player.id}-${Date.now()}`,
                playerId: null,
                playerName: 'System',
                message: `${player.name} joined the room`,
                timestamp: Date.now(),
                isSystem: true,
            };
            set((state) => ({
                chatMessages: [...state.chatMessages, message],
            }));
        });

        socketService.onPlayerLeft((playerId) => {
            const room = get().room;
            if (room) {
                const player = room.players.find(p => p.id === playerId);
                const message: ChatMessage = {
                    id: `left-${playerId}-${Date.now()}`,
                    playerId: null,
                    playerName: 'System',
                    message: `${player?.name || 'A player'} left the room`,
                    timestamp: Date.now(),
                    isSystem: true,
                };
                set((state) => ({
                    chatMessages: [...state.chatMessages, message],
                }));
            }
        });

        socketService.onExplosionSequence((sequence) => {
            set({ explosionSequence: sequence });
        });

        socketService.onTurnChanged((playerId) => {
            const room = get().room;
            if (room) {
                const player = room.players.find(p => p.id === playerId);
                console.log(`Turn changed to: ${player?.name}`);
            }
        });
    },

    // Cleanup socket listeners
    cleanup: () => {
        socketService.disconnect();
        set({
            room: null,
            gameState: null,
            chatMessages: [],
            currentPlayerId: null,
            error: null,
            explosionSequence: [],
        });
    },

    // Setters
    setRoom: (room) => set({ room }),
    setGameState: (gameState) => set({ gameState }),
    addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
    })),
    setError: (error) => set({ error }),
    setExplosionSequence: (sequence) => set({ explosionSequence: sequence }),
    clearExplosionSequence: () => set({ explosionSequence: [] }),

    // Computed getters
    getCurrentPlayer: () => {
        const state = get();
        if (!state.room || !state.currentPlayerId) return null;
        return state.room.players.find(p => p.id === state.currentPlayerId) || null;
    },

    isMyTurn: () => {
        const state = get();
        if (!state.room || !state.gameState || !state.currentPlayerId) return false;
        const currentPlayer = state.room.players[state.gameState.currentTurnIndex];
        return currentPlayer?.id === state.currentPlayerId;
    },

    isHost: () => {
        const state = get();
        if (!state.room || !state.currentPlayerId) return false;
        return state.room.hostId === state.currentPlayerId;
    },
}));
