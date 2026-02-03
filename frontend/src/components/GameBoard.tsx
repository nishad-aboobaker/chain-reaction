import { useMultiplayerStore } from '../store/multiplayerStore';
import { useAppStore } from '../store/appStore';
import { socketService } from '../services/socketService';
import Grid from './Grid';

export default function GameBoard() {
    const { room, gameState, isMyTurn, cleanup } = useMultiplayerStore();
    const { setScreen } = useAppStore();

    if (!room || !gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-panel p-12">
                    <p className="text-white">Loading game...</p>
                </div>
            </div>
        );
    }

    const currentPlayer = room.players[gameState.currentTurnIndex];
    const myTurn = isMyTurn();

    const handleExit = () => {
        socketService.leaveRoom();
        cleanup();
        setScreen('menu');
    };

    return (
        <div className="min-h-screen p-4">
            {/* Header */}
            <div className="glass-panel p-4 mb-4 max-w-6xl mx-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Chain Reaction</h1>
                    <div className="flex gap-2 items-center">
                        <div className="text-sm text-white/60">Round: {gameState.roundNumber}</div>
                        <button className="btn-secondary" onClick={handleExit}>
                            Exit to Menu
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto flex gap-4">
                {/* Player Info Sidebar */}
                <div className="glass-panel p-4" style={{ minWidth: '220px' }}>
                    <h2 className="text-xl font-bold mb-4 text-white">Players</h2>
                    <div className="space-y-2">
                        {room.players.map((player, index) => (
                            <div
                                key={player.id}
                                className="glass-panel p-3"
                                style={{
                                    border: index === gameState.currentTurnIndex ? '2px solid rgba(147, 51, 234, 0.8)' : '1px solid rgba(255, 255, 255, 0.2)',
                                    backgroundColor: index === gameState.currentTurnIndex ? 'rgba(147, 51, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    opacity: player.isActive ? 1 : 0.5,
                                }}
                            >
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: player.color }}
                                        />
                                        <span className="font-semibold text-white">{player.name}</span>
                                    </div>
                                    <span className="text-xs text-white/60">{player.orbCount}</span>
                                </div>
                                {index === gameState.currentTurnIndex && (
                                    <div className="text-xs text-purple-300 mt-1">Current Turn</div>
                                )}
                                {!player.isActive && (
                                    <div className="text-xs text-red-400 mt-1">Eliminated</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {gameState.isGameOver && gameState.winnerId && (
                        <div className="mt-6 glass-panel p-4 bg-purple-600/30 border-2 border-purple-500">
                            <div className="text-lg font-bold text-white text-center">
                                🎉 Game Over!
                            </div>
                            <div className="text-sm text-white/80 text-center mt-2">
                                {room.players.find(p => p.id === gameState.winnerId)?.name} wins!
                            </div>
                        </div>
                    )}
                </div>

                {/* Game Grid */}
                <div className="flex-1 glass-panel p-4">
                    <div className="text-center mb-4">
                        <div className="text-lg text-white/80">Current Turn:</div>
                        <div className="text-2xl font-bold flex items-center justify-center gap-2 mt-1">
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: currentPlayer.color }}
                            />
                            <span style={{ color: currentPlayer.color }}>
                                {currentPlayer.name}
                            </span>
                        </div>
                        {myTurn && !gameState.isGameOver && (
                            <div className="text-sm text-green-400 mt-2">
                                ✓ Your turn! Click a cell to place an orb
                            </div>
                        )}
                        {!myTurn && !gameState.isGameOver && (
                            <div className="text-sm text-white/50 mt-2">
                                Waiting for {currentPlayer.name}...
                            </div>
                        )}
                    </div>

                    <Grid />
                </div>
            </div>
        </div>
    );
}
