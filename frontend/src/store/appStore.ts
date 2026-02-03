import { create } from 'zustand';

type Screen = 'menu' | 'create-room' | 'join-room' | 'how-to-play' | 'lobby' | 'game';

interface AppState {
    currentScreen: Screen;
    playerName: string;
    roomCode: string;
    setScreen: (screen: Screen) => void;
    setPlayerName: (name: string) => void;
    setRoomCode: (code: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentScreen: 'menu',
    playerName: '',
    roomCode: '',
    setScreen: (screen) => set({ currentScreen: screen }),
    setPlayerName: (name) => set({ playerName: name }),
    setRoomCode: (code) => set({ roomCode: code }),
}));
