import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import CustomSelect from './CustomSelect';
import type { RoomSettings } from '../../../shared/types';

export default function CreateRoom() {
    const { setScreen, setPlayerName, setRoomCode, playerName } = useAppStore();
    const initialize = useMultiplayerStore((state) => state.initialize);
    const [localName, setLocalName] = useState(playerName);
    const [gridSize, setGridSize] = useState<keyof typeof import('../../../shared/types').GRID_SIZES>('MEDIUM');
    const [maxPlayers, setMaxPlayers] = useState('4');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (localName.trim().length < 3) return;

        setIsCreating(true);
        setError('');
        setPlayerName(localName.trim());

        // Initialize socket connection and listeners
        initialize();

        const settings: RoomSettings = {
            gridSize,
            maxPlayers: parseInt(maxPlayers),
            turnTimer: null,
        };

        socketService.createRoom(localName.trim(), settings, (response) => {
            setIsCreating(false);

            if (response.success && response.roomCode) {
                setRoomCode(response.roomCode);
                setScreen('lobby');
            } else {
                setError(response.error || 'Failed to create room');
            }
        });
    };

    const gridSizeOptions = [
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

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-12 max-w-md w-full">
                <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r bg-clip-text text-transparent">
                    Create Room
                </h2>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-2 text-white/80">Your Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter your name (3-15 characters)"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            maxLength={15}
                            autoFocus
                        />
                    </div>

                    <CustomSelect
                        label="Grid Size"
                        value={gridSize}
                        options={gridSizeOptions}
                        onChange={(value) => setGridSize(value as 'SMALL' | 'MEDIUM' | 'LARGE')}
                    />

                    <CustomSelect
                        label="Max Players"
                        value={maxPlayers}
                        options={maxPlayersOptions}
                        onChange={setMaxPlayers}
                    />

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        className="btn-primary mt-4"
                        onClick={handleCreate}
                        disabled={localName.trim().length < 3 || isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Room'}
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => setScreen('menu')}
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}
