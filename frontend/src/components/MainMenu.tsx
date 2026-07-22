import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { GameMode } from '../../../shared/types';
import { ChainReactionIcon, XOIcon, ArcadeIcon, SparkleIcon, LinkIcon, BookIcon } from './Icons';

export default function MainMenu() {
    const { setScreen, selectedGameMode, setSelectedGameMode } = useAppStore();
    const [view, setView] = useState<'select-game' | 'game-hub'>('select-game');

    const handleSelectGame = (mode: GameMode) => {
        setSelectedGameMode(mode);
        setView('game-hub');
    };

    const getGameTitle = () => {
        return selectedGameMode === 'XOX' ? 'XOX (Tic-Tac-Toe)' : 'Chain Reaction';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-slate-50">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/20 blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px] -z-10" />

            <div className="w-full max-w-4xl mx-auto">
                {view === 'select-game' ? (
                    /* Step 1: Game Selection Menu */
                    <div className="animate-fadeIn space-y-8">
                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm mb-4 shadow-xs border border-indigo-200">
                                <ArcadeIcon className="w-4 h-4 text-indigo-600" />
                                Arcade Games Hub
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-3">
                                Select a Game
                            </h1>
                            <p className="text-slate-600 text-base sm:text-lg font-medium">
                                Choose your favorite multiplayer strategy game to play with friends online.
                            </p>
                        </div>

                        {/* Game Selection Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {/* Card 1: Chain Reaction */}
                            <div 
                                onClick={() => handleSelectGame('CHAIN_REACTION')}
                                className="group relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/15 hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                            <ChainReactionIcon className="w-9 h-9" />
                                        </div>
                                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                                            2-8 Players
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        Chain Reaction
                                    </h2>
                                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                                        Take turns placing orbs. Reach critical mass to trigger explosive chain reactions and conquer the board!
                                    </p>
                                </div>

                                <div className="flex items-center text-indigo-600 font-bold text-base group-hover:translate-x-1 transition-transform">
                                    <span>Select Game</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 2: XOX (Tic-Tac-Toe) */}
                            <div 
                                onClick={() => handleSelectGame('XOX')}
                                className="group relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-500/15 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                            <XOIcon className="w-9 h-9" />
                                        </div>
                                        <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">
                                            2 Players
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                                        XOX (Tic-Tac-Toe)
                                    </h2>
                                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                                        Classic tactical 3-in-a-row line alignment with custom player colors, instant moves, and tie detection!
                                    </p>
                                </div>

                                <div className="flex items-center text-purple-600 font-bold text-base group-hover:translate-x-1 transition-transform">
                                    <span>Select Game</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Step 2: Selected Game Actions Hub */
                    <div className="animate-fadeIn space-y-6 max-w-md mx-auto">
                        <button
                            onClick={() => setView('select-game')}
                            className="flex items-center text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors group cursor-pointer mb-2"
                        >
                            <svg className="w-5 h-5 mr-1.5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Choose Different Game
                        </button>

                        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white shadow-2xl shadow-slate-200/60 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-sm">
                                {selectedGameMode === 'XOX' ? <XOIcon className="w-10 h-10" /> : <ChainReactionIcon className="w-10 h-10" />}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                                {getGameTitle()}
                            </h2>
                            <p className="text-slate-500 text-sm font-medium mb-8">
                                Ready to play online with friends
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setScreen('create-room')}
                                    className="group w-full flex items-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5 text-left cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                                        <SparkleIcon className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-base font-bold mb-0.5">Create Room</h3>
                                        <p className="text-xs text-white/80">Host a game & invite friends</p>
                                    </div>
                                    <svg className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setScreen('join-room')}
                                    className="group w-full flex items-center p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 text-left cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-base font-bold text-slate-900 mb-0.5">Join Room</h3>
                                        <p className="text-xs text-slate-500">Enter a code to join an existing game</p>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setScreen('how-to-play')}
                                    className="group w-full flex items-center p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 text-left cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                        <BookIcon className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-base font-bold text-slate-900 mb-0.5">How to Play</h3>
                                        <p className="text-xs text-slate-500">Learn rules and strategy</p>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
