import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import CustomSelect from './CustomSelect';
import type { RoomSettings, GameMode } from '../../../shared/types';
import { GRID_SIZES } from '../../../shared/types';

export default function CreateRoom() {
    const { setScreen, setPlayerName, setRoomCode, setPlayerToken, playerName, selectedGameMode } = useAppStore();
    const initialize = useMultiplayerStore((state) => state.initialize);
    
    const initialMode: GameMode = selectedGameMode || 'CHAIN_REACTION';
    const [name, setName] = useState(playerName);
    const [gameMode, setGameMode] = useState<GameMode>(initialMode);
    const [gridSize, setGridSize] = useState<keyof typeof GRID_SIZES>(initialMode === 'XOX' ? 'XOX_3X3' : 'MEDIUM');
    const [maxPlayers, setMaxPlayers] = useState(initialMode === 'XOX' ? '2' : '4');
    const [turnTimer, setTurnTimer] = useState('60');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGameModeChange = (mode: GameMode) => {
        setGameMode(mode);
        if (mode === 'XOX') {
            setGridSize('XOX_3X3');
            setMaxPlayers('2');
        } else {
            setGridSize('MEDIUM');
            setMaxPlayers('4');
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }

        setIsLoading(true);
        setError('');
        setPlayerName(name.trim());
        initialize();

        const settings: RoomSettings = {
            gameMode,
            gridSize,
            maxPlayers: parseInt(maxPlayers),
            turnTimer: parseInt(turnTimer) > 0 ? parseInt(turnTimer) : null,
        };

        socketService.createRoom(name.trim(), settings, (response) => {
            setIsLoading(false);
            if (response.success && response.roomCode) {
                setRoomCode(response.roomCode);
                if (response.playerToken) {
                    setPlayerToken(response.playerToken);
                    socketService.setAuthToken(response.playerToken);
                }
                setScreen('lobby');
            } else {
                setError(response.error || 'Failed to create room');
            }
        });
    };

    const gameModeOptions = [
        { value: 'CHAIN_REACTION', label: '💥 Chain Reaction' },
        { value: 'XOX', label: '❌⭕ XOX (Tic-Tac-Toe)' },
    ];

    const gridSizeOptions = gameMode === 'XOX' ? [
        { value: 'XOX_3X3', label: 'Classic (3×3)' },
    ] : [
        { value: 'SMALL', label: 'Small (7×5)' },
        { value: 'MEDIUM', label: 'Medium (9×6)' },
        { value: 'LARGE', label: 'Large (11×7)' },
    ];

    const maxPlayersOptions = [
        { value: '2', label: '2 Players' },
        { value: '3', label: '3 Players' },
        { value: '4', label: '4 Players' },
        { value: '5', label: '5 Players' },
        { value: '6', label: '6 Players' },
        { value: '7', label: '7 Players' },
        { value: '8', label: '8 Players' },
    ];

    const turnTimerOptions = [
        { value: '0', label: 'No Timer' },
        { value: '30', label: '30 seconds' },
        { value: '60', label: '60 seconds' },
        { value: '90', label: '90 seconds' },
        { value: '120', label: '120 seconds' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-300/20 blur-[120px] -z-10" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-400/20 blur-[120px] -z-10" />

            <div className="bg-white/80 backdrop-blur-xl border border-white p-6 sm:p-10 md:p-12 max-w-xl w-full rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setScreen('menu')}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium group cursor-pointer"
                >
                    <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Menu
                </button>

                <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-slate-900 tracking-tight">
                    Create Room
                </h2>

                <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            placeholder="Enter your nickname (2-20 chars)"
                            maxLength={20}
                        />
                    </div>

                    <div>
                        <CustomSelect
                            label="Game Mode"
                            options={gameModeOptions}
                            value={gameMode}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(val) => handleGameModeChange(val as any)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CustomSelect
                            label="Grid Size"
                            options={gridSizeOptions}
                            value={gridSize}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(val) => setGridSize(val as any)}
                        />

                        <CustomSelect
                            label="Max Players"
                            options={maxPlayersOptions}
                            value={maxPlayers}
                            onChange={setMaxPlayers}
                        />

                        <div className="md:col-span-2">
                            <CustomSelect
                                label="Turn Timer"
                                options={turnTimerOptions}
                                value={turnTimer}
                                onChange={setTurnTimer}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex items-center">
                            <span className="text-red-500 mr-2">⚠️</span>
                            <span className="text-red-700 text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || name.trim().length < 2}
                        className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 text-lg flex items-center justify-center cursor-pointer"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                        ) : (
                            'Host Game'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
