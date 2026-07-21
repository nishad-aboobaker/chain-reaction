import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';

export default function Lobby() {
    const { setScreen } = useAppStore();
    const { room, getCurrentPlayer, isHost, cleanup } = useMultiplayerStore();
    const currentPlayer = getCurrentPlayer();

    // Listen for game start
    useEffect(() => {
        const handleGameStarted = () => {
            setScreen('game');
        };

        socketService.onGameStarted(handleGameStarted);

        return () => {
            socketService.off('game-started', handleGameStarted);
        };
    }, [setScreen]);

    const handleReady = () => {
        if (!currentPlayer) return;
        socketService.setPlayerReady(!currentPlayer.isReady);
    };

    const handleStartGame = () => {
        socketService.startGame();
    };

    const handleLeave = () => {
        socketService.leaveRoom();
        cleanup();
        setScreen('menu');
    };

    const handleCopyCode = () => {
        if (room?.code) {
            navigator.clipboard.writeText(room.code);
        }
    };

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-panel p-12">
                    <p className="text-white">Loading lobby...</p>
                </div>
            </div>
        );
    }

    const allPlayersReady = room.players.every(p => p.isReady);
    const canStart = isHost() && room.players.length >= 2 && allPlayersReady;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-6 md:p-12 max-w-3xl w-full">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-gradient-to-r bg-clip-text text-transparent">
                    Game Lobby
                </h2>

                <div className="text-center mb-6 md:mb-8">
                    <p className="text-white/60 mb-2">Room Code</p>
                    <div className="text-4xl md:text-5xl font-bold tracking-widest text-white mb-2">
                        {room.code}
                    </div>
                    <button
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        onClick={handleCopyCode}
                    >
                        📋 Copy Code
                    </button>
                </div>

                <div className="mb-6 md:mb-8">
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-white">
                        Players ({room.players.length}/{room.settings.maxPlayers})
                    </h3>
                    <div className="space-y-2">
                        {room.players.map((player) => (
                            <div
                                key={player.id}
                                className="glass-panel p-3 md:p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                                        style={{ backgroundColor: player.color }}
                                    />
                                    <span className="font-semibold text-sm md:text-base">{player.name}</span>
                                    {player.isHost && (
                                        <span className="text-[10px] md:text-xs bg-purple-600 px-2 py-1 rounded">
                                            HOST
                                        </span>
                                    )}
                                    {player.id === currentPlayer?.id && (
                                        <span className="text-[10px] md:text-xs bg-blue-600 px-2 py-1 rounded">
                                            YOU
                                        </span>
                                    )}
                                </div>
                                <span className={`text-sm ${player.isReady ? "text-green-400" : "text-white/50"}`}>
                                    {player.isReady ? "✓ Ready" : "Not Ready"}
                                </span>
                            </div>
                        ))}

                        {room.players.length < room.settings.maxPlayers && (
                            <div className="glass-panel p-3 md:p-4 text-center text-white/50 text-sm md:text-base">
                                Waiting for players to join...
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-bold mb-3 text-white">Game Settings</h3>
                    <div className="glass-panel p-3 md:p-4 space-y-2 text-white/80 text-sm md:text-base">
                        <div className="flex justify-between">
                            <span>Grid Size:</span>
                            <span className="font-semibold">{room.settings.gridSize}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Max Players:</span>
                            <span className="font-semibold">{room.settings.maxPlayers}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Turn Timer:</span>
                            <span className="font-semibold">
                                {room.settings.turnTimer || 'None'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
                    <button
                        className="btn-secondary flex-1 order-2 md:order-1"
                        onClick={handleReady}
                    >
                        {currentPlayer?.isReady ? '✓ Ready' : 'Ready Up'}
                    </button>

                    {isHost() && (
                        <button
                            className="btn-primary flex-1 order-1 md:order-2"
                            onClick={handleStartGame}
                            disabled={!canStart}
                        >
                            Start Game
                        </button>
                    )}
                </div>

                {isHost() && !canStart && (
                    <p className="text-center text-xs md:text-sm text-white/60 mb-4">
                        {room.players.length < 2
                            ? 'Need at least 2 players to start'
                            : 'All players must be ready'}
                    </p>
                )}

                <button
                    className="btn-secondary w-full"
                    onClick={handleLeave}
                >
                    Leave Room
                </button>
            </div>
        </div>
    );
}
