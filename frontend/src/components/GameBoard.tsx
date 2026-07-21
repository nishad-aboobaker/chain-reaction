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
            <div className="glass-panel p-3 mb-4 max-w-6xl mx-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-bold text-white">Chain Reaction</h1>
                    <div className="flex gap-2 items-center">
                        <div className="text-xs md:text-sm text-white/60">Round: {gameState.roundNumber}</div>
                        <button className="btn-secondary px-3 py-1 text-sm md:px-4 md:py-2 md:text-base" onClick={handleExit}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Player Info Sidebar - Scrollable Horizontal on Mobile, Vertical on Desktop */}
                <div className="glass-panel p-3 md:p-4 w-full md:w-64 flex flex-col order-2 md:order-1">
                    <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-white">Players</h2>

                    <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 scrollbar-hide">
                        {room.players.map((player, index) => (
                            <div
                                key={player.id}
                                className="glass-panel p-2 md:p-3 flex-shrink-0"
                                style={{
                                    border: index === gameState.currentTurnIndex ? '2px solid rgba(147, 51, 234, 0.8)' : '1px solid rgba(255, 255, 255, 0.2)',
                                    backgroundColor: index === gameState.currentTurnIndex ? 'rgba(147, 51, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    opacity: player.isActive ? 1 : 0.5,
                                    minWidth: '140px',
                                    width: 'auto'
                                }}
                            >
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                                            style={{ backgroundColor: player.color }}
                                        />
                                        <span className="font-semibold text-sm md:text-base text-white truncate max-w-[80px] md:max-w-none">{player.name}</span>
                                    </div>
                                    <span className="text-xs text-white/60">{player.orbCount}</span>
                                </div>
                                {index === gameState.currentTurnIndex && (
                                    <div className="text-[10px] md:text-xs text-purple-300 mt-1">Current Turn</div>
                                )}
                                {!player.isActive && (
                                    <div className="text-[10px] md:text-xs text-red-400 mt-1">Eliminated</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {gameState.isGameOver && gameState.winnerId && (
                        <div className="mt-4 md:mt-6 glass-panel p-3 md:p-4 bg-purple-600/30 border-2 border-purple-500">
                            <div className="text-base md:text-lg font-bold text-white text-center">
                                🎉 Game Over!
                            </div>
                            <div className="text-xs md:text-sm text-white/80 text-center mt-1 md:mt-2">
                                {room.players.find(p => p.id === gameState.winnerId)?.name} wins!
                            </div>
                        </div>
                    )}
                </div>

                {/* Game Grid */}
                <div className="flex-1 glass-panel p-2 md:p-4 order-1 md:order-2">
                    <div className="text-center mb-2 md:mb-4">
                        <div className="text-sm md:text-lg text-white/80">Current Turn:</div>
                        <div className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2 mt-1">
                            <div
                                className="w-4 h-4 md:w-6 md:h-6 rounded-full"
                                style={{ backgroundColor: currentPlayer.color }}
                            />
                            <span style={{ color: currentPlayer.color }}>
                                {currentPlayer.name}
                            </span>
                        </div>
                        {myTurn && !gameState.isGameOver && (
                            <div className="text-xs md:text-sm text-green-400 mt-1 md:mt-2">
                                ✓ Your turn!
                            </div>
                        )}
                        {!myTurn && !gameState.isGameOver && (
                            <div className="text-xs md:text-sm text-white/50 mt-1 md:mt-2">
                                Waiting for {currentPlayer.name}...
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <Grid />
                    </div>
                </div>
            </div>
        </div>
    );
}
