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
            // Optionally could add a toast here
        }
    };

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const allPlayersReady = room.players.every(p => p.isReady);
    const canStart = isHost() && room.players.length >= 2 && allPlayersReady;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[100px] -z-10" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[100px] -z-10" />

            <div className="glass-card p-6 md:p-10 max-w-5xl w-full flex flex-col h-full md:h-[80vh] min-h-[600px]">
                
                {/* Header Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-6 mb-8">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Game Lobby
                        </h2>
                        <p className="text-slate-500 mt-1">Get ready to start the chain reaction.</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Room Code</p>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold tracking-widest text-indigo-600 font-mono">
                                {room.code}
                            </span>
                            <button
                                className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 hover:border-indigo-200"
                                onClick={handleCopyCode}
                                title="Copy Code"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0">
                    {/* Left Column: Player List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800">
                                Players
                            </h3>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold">
                                {room.players.length} / {room.settings.maxPlayers}
                            </span>
                        </div>
                        
                        <div className="overflow-y-auto pr-2 space-y-3 flex-1 pb-4">
                            {room.players.map((player) => (
                                <div
                                    key={player.id}
                                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-indigo-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-full shadow-inner ring-4 ring-white"
                                            style={{ backgroundColor: player.color }}
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{player.name}</span>
                                                {player.isHost && (
                                                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                        Host
                                                    </span>
                                                )}
                                                {player.id === currentPlayer?.id && (
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${player.isReady ? "bg-green-50 text-green-600 border border-green-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                                        {player.isReady ? "Ready" : "Waiting"}
                                    </div>
                                </div>
                            ))}

                            {room.players.length < room.settings.maxPlayers && (
                                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 bg-slate-50/50">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Waiting for players...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div className="w-full md:w-80 flex flex-col shrink-0">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6">
                            <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Game Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                    <span className="text-slate-500 font-medium">Grid Size</span>
                                    <span className="font-bold text-slate-800">{room.settings.gridSize}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                    <span className="text-slate-500 font-medium">Max Players</span>
                                    <span className="font-bold text-slate-800">{room.settings.maxPlayers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Turn Timer</span>
                                    <span className="font-bold text-slate-800">
                                        {room.settings.turnTimer ? `${room.settings.turnTimer}s` : 'None'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3 flex-shrink-0">
                            <button
                                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 ${
                                    currentPlayer?.isReady 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' 
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                                }`}
                                onClick={handleReady}
                            >
                                {currentPlayer?.isReady ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        Ready
                                    </>
                                ) : (
                                    'Ready Up'
                                )}
                            </button>

                            {isHost() && (
                                <div>
                                    <button
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-lg"
                                        onClick={handleStartGame}
                                        disabled={!canStart}
                                    >
                                        Start Game
                                    </button>
                                    {!canStart && (
                                        <p className="text-center text-xs text-slate-500 mt-2 font-medium">
                                            {room.players.length < 2 ? 'Need at least 2 players' : 'All players must be ready'}
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                className="w-full py-3 mt-4 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors border border-transparent hover:border-red-100"
                                onClick={handleLeave}
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
