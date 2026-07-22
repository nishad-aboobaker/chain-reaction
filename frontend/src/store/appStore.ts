import { create } from 'zustand';
import type { GameMode } from '../../../shared/types';

type Screen = 'menu' | 'create-room' | 'join-room' | 'how-to-play' | 'lobby' | 'game';

interface AppState {
    currentScreen: Screen;
    selectedGameMode: GameMode;
    playerName: string;
    roomCode: string;
    playerToken: string | null;
    setScreen: (screen: Screen) => void;
    setSelectedGameMode: (mode: GameMode) => void;
    setPlayerName: (name: string) => void;
    setRoomCode: (code: string) => void;
    setPlayerToken: (token: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentScreen: 'menu',
    selectedGameMode: 'CHAIN_REACTION',
    playerName: '',
    roomCode: '',
    playerToken: null,
    setScreen: (screen) => set({ currentScreen: screen }),
    setSelectedGameMode: (mode) => set({ selectedGameMode: mode }),
    setPlayerName: (name) => set({ playerName: name }),
    setRoomCode: (code) => set({ roomCode: code }),
    setPlayerToken: (token) => set({ playerToken: token }),
}));
