import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import Grid from './Grid';

export default function GameBoard() {
    const { setScreen } = useAppStore();
    const { room, gameState, getCurrentPlayer, cleanup } = useMultiplayerStore();
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

    const handleLeave = () => {
        socketService.leaveRoom();
        cleanup();
        setScreen('menu');
    };

    if (!room || !gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-slate-50">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/10 blur-[100px] -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[100px] -z-10" />

            {/* Sidebar (Players & Info) */}
            <div className="w-full md:w-80 lg:w-96 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shadow-sm z-10 shrink-0">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chain Reaction</h1>
                        <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Round: {gameState.roundNumber}
                        </div>
                    </div>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Leave Game"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Players</h2>
                    <div className="space-y-3">
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
                                            className={`w-10 h-10 rounded-full shadow-inner ring-4 ring-white flex items-center justify-center ${isEliminated ? 'grayscale' : ''}`}
                                            style={{ backgroundColor: player.color }}
                                        >
                                            {isEliminated && <span className="text-white font-bold">✕</span>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                <span className="truncate max-w-[100px]">{player.name}</span>
                                                {player.id === currentPlayer?.id && (
                                                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">You</span>
                                                )}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                {isEliminated ? 'Eliminated' : `${player.orbCount} orbs`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Current Turn indicator at bottom of sidebar */}
                {!gameOver && room.players[gameState.currentTurnIndex] && (
                    <div className="p-6 bg-slate-100 border-t border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Turn</div>
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-full shadow-sm"
                                style={{ backgroundColor: room.players[gameState.currentTurnIndex].color }}
                            ></div>
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

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative min-h-0">
                <div className="w-full h-full flex flex-col items-center justify-center">
                    {gameOver && winner ? (
                        <div className="mb-8 animate-bounce-in bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center z-20 max-w-md w-full">
                            <div 
                                className="w-24 h-24 rounded-full mx-auto mb-6 shadow-lg flex items-center justify-center text-4xl"
                                style={{ backgroundColor: room.players.find(p => p.id === winner)?.color || '#94a3b8' }}
                            >
                                👑
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                                {room.players.find(p => p.id === winner)?.name || 'Someone'} Wins!
                            </h2>
                            <p className="text-slate-500 mb-8 font-medium">Dominated the board with a massive chain reaction.</p>
                            <button
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all duration-300 text-lg shadow-lg hover:-translate-y-1"
                                onClick={handleLeave}
                            >
                                Back to Lobby
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full max-h-[85vh] flex items-center justify-center">
                            <Grid />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
