import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';

export default function JoinRoom() {
    const { setScreen, setPlayerName, setRoomCode, setPlayerToken, playerName } = useAppStore();
    const initialize = useMultiplayerStore((state) => state.initialize);
    const [localName, setLocalName] = useState(playerName);
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = () => {
        if (localName.trim().length < 2 || code.trim().length !== 6) return;

        setIsJoining(true);
        setError('');
        setPlayerName(localName.trim());
        setRoomCode(code.toUpperCase());

        // Initialize socket connection and listeners
        initialize();

        socketService.joinRoom(code.toUpperCase(), localName.trim(), (response) => {
            setIsJoining(false);

            if (response.success) {
                if (response.playerToken) {
                    setPlayerToken(response.playerToken);
                    socketService.setAuthToken(response.playerToken);
                }
                setScreen('lobby');
            } else {
                setError(response.error || 'Failed to join room');
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-12 max-w-md w-full">
                <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r bg-clip-text text-transparent">
                    Join Room
                </h2>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-2 text-white/80">Your Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter your name (2-20 characters)"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            maxLength={20}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-white/80">Room Code</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter 6-character room code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1.5rem', textAlign: 'center' }}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        className="btn-primary mt-4"
                        onClick={handleJoin}
                        disabled={localName.trim().length < 2 || code.trim().length !== 6 || isJoining}
                    >
                        {isJoining ? 'Joining...' : 'Join Room'}
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
