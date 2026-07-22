import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import Grid from './Grid';

export default function GameBoard() {
    const { setScreen } = useAppStore();
    const { room, gameState, getCurrentPlayer, isHost, cleanup } = useMultiplayerStore();
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    const currentPlayer = getCurrentPlayer();

    useEffect(() => {
        socketService.onGameOver((winnerId) => {
            setGameOver(true);
            setWinner(winnerId);
        });

        return () => {
            socketService.off('game-over', () => { });
        };
    }, []);

    // Return to lobby when game state gets reset by host
    useEffect(() => {
        if (room && room.gameState === null) {
            setScreen('lobby');
        }
    }, [room, room?.gameState, setScreen]);

    const handleLeave = () => {
        socketService.leaveRoom();
        cleanup();
        setScreen('menu');
    };

    const handlePlayAgain = () => {
        if (isHost()) {
            socketService.playAgain();
        }
    };

    if (!room || !gameState) {
        return (
            <div className="h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-slate-50">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const isDraw = winner === 'DRAW' || gameState.isDraw;
    const gameModeTitle = room.settings.gameMode === 'XOX' ? 'XOX (Tic-Tac-Toe)' : 'Chain Reaction';

    return (
        <div className="h-[100dvh] w-full flex flex-col md:flex-row relative overflow-hidden bg-slate-50 select-none">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/10 blur-[100px] -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[100px] -z-10" />

            {/* Mobile Compact Header & Player Bar (Visible on < md) */}
            <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs z-20 shrink-0">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">{gameModeTitle}</h1>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            Round {gameState.roundNumber}
                        </span>
                    </div>
                    <button
                        onClick={handleLeave}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Leave Game"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Horizontal Player Bar */}
                <div className="px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {room.players.map((player, index) => {
                        const isCurrentTurn = gameState.currentTurnIndex === index;
                        const isEliminated = !player.isActive;

                        return (
                            <div
                                key={player.id}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shrink-0 transition-all text-xs font-bold ${
                                    isCurrentTurn
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-400/40'
                                        : isEliminated
                                            ? 'border-slate-100 bg-slate-50 text-slate-400 opacity-50'
                                            : 'border-slate-200 bg-white text-slate-700'
                                }`}
                            >
                                <div
                                    className="w-3 h-3 rounded-full shadow-inner ring-1 ring-white shrink-0"
                                    style={{ backgroundColor: player.color }}
                                />
                                <span className="max-w-[65px] truncate">{player.name}</span>
                                {player.symbol && <span className="text-indigo-600 font-extrabold ml-0.5">({player.symbol})</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Desktop Sidebar (Visible on >= md) */}
            <div className="hidden md:flex w-80 lg:w-96 bg-white border-r border-slate-200 flex-col shadow-sm z-10 shrink-0 h-full">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{gameModeTitle}</h1>
                        <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Round: {gameState.roundNumber}
                        </div>
                    </div>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Leave Game"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Players</h2>
                    {room.players.map((player, index) => {
                        const isCurrentTurn = gameState.currentTurnIndex === index;
                        const isEliminated = !player.isActive;

                        return (
                            <div
                                key={player.id}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                                    isCurrentTurn
                                        ? 'border-indigo-500 shadow-md bg-indigo-50/50'
                                        : isEliminated
                                            ? 'border-slate-100 bg-slate-50 opacity-60'
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                            >
                                {isCurrentTurn && (
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-indigo-500 rounded-r-md"></div>
                                )}
                                
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full shadow-inner ring-4 ring-white flex items-center justify-center font-black text-lg text-white ${isEliminated ? 'grayscale' : ''}`}
                                        style={{ backgroundColor: player.color }}
                                    >
                                        {player.symbol || (isEliminated ? '✕' : '')}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                            <span className="truncate max-w-[100px]">{player.name}</span>
                                            {player.id === currentPlayer?.id && (
                                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">You</span>
                                            )}
                                        </div>
                                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                                            {isEliminated ? 'Eliminated' : room.settings.gameMode === 'XOX' ? `Symbol: ${player.symbol}` : `${player.orbCount} orbs`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Current Turn indicator at bottom of sidebar */}
                {!gameOver && room.players[gameState.currentTurnIndex] && (
                    <div className="p-6 bg-slate-100 border-t border-slate-200 mt-auto">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Turn</div>
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-white font-black text-sm"
                                style={{ backgroundColor: room.players[gameState.currentTurnIndex].color }}
                            >
                                {room.players[gameState.currentTurnIndex].symbol}
                            </div>
                            <span className="font-bold text-lg text-slate-900">
                                {room.players[gameState.currentTurnIndex].name}'s Turn
                            </span>
                        </div>
                        {room.players[gameState.currentTurnIndex].id === currentPlayer?.id && (
                            <div className="mt-3 text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-lg inline-block">
                                It's your move!
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Game Board Area */}
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 relative min-h-0 min-w-0 overflow-hidden">
                {gameOver ? (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 text-center z-20 max-w-md w-[92vw] sm:w-full">
                        <div 
                            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 shadow-lg flex items-center justify-center text-3xl sm:text-4xl text-white font-black"
                            style={{ backgroundColor: isDraw ? '#64748b' : (room.players.find(p => p.id === winner)?.color || '#94a3b8') }}
                        >
                            {isDraw ? '🤝' : '👑'}
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">
                            {isDraw ? "It's a Draw!" : `${room.players.find(p => p.id === winner)?.name || 'Someone'} Wins!`}
                        </h2>
                        <p className="text-slate-500 mb-6 text-xs sm:text-base font-medium">
                            {isDraw ? 'A fierce match resulting in a tie.' : 'Dominated the grid and took the victory!'}
                        </p>
                        
                        <div className="space-y-2.5 sm:space-y-3">
                            {isHost() ? (
                                <button
                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all text-base shadow-lg cursor-pointer"
                                    onClick={handlePlayAgain}
                                >
                                    🔄 Play Again
                                </button>
                            ) : (
                                <div className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-xl font-semibold text-sm border border-slate-200">
                                    Waiting for host to restart game...
                                </div>
                            )}

                            <button
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm cursor-pointer"
                                onClick={handleLeave}
                            >
                                Leave Game
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full max-h-full flex items-center justify-center overflow-hidden">
                        <Grid />
                    </div>
                )}
            </div>
        </div>
    );
}
