import { useAppStore } from '../store/appStore';
import { ChainReactionIcon, ArcadeIcon, XOIcon } from './Icons';

export default function HowToPlay() {
    const { setScreen, selectedGameMode } = useAppStore();
    const isXox = selectedGameMode === 'XOX';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-300/20 blur-[120px] -z-10" />
            
            <div className="bg-white/80 backdrop-blur-xl border border-white p-6 md:p-12 max-w-3xl w-full rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={() => setScreen('menu')}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium group cursor-pointer"
                >
                    <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Menu
                </button>

                <h2 className="text-3xl md:text-5xl font-black mb-8 text-slate-900 tracking-tight">
                    How to Play {isXox ? 'XOX (Tic-Tac-Toe)' : 'Chain Reaction'}
                </h2>

                {isXox ? (
                    /* XOX Rules */
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm border border-purple-200">
                                    <XOIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Objective</h3>
                            </div>
                            <p className="text-base text-slate-600 font-medium pl-13">
                                Be the first player to align 3 of your symbols horizontally, vertically, or diagonally!
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800">Rules & Strategy</h3>
                            <ul className="space-y-3">
                                {[
                                    'Player 1 places ❌ symbols, Player 2 places ⭕ symbols.',
                                    'Take turns placing one symbol per turn in any empty 3×3 grid cell.',
                                    'Form an unbroken line of 3 matching symbols to win the match.',
                                    'If all 9 cells are filled with no 3-in-a-row, the game ends in a Draw.'
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 items-start">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">{i+1}</span>
                                        <span className="text-sm sm:text-base">{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    /* Chain Reaction Rules */
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-200">
                                    <ChainReactionIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Objective</h3>
                            </div>
                            <p className="text-lg text-slate-600 font-medium pl-13">
                                Be the last player with orbs remaining on the board!
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
                                        <ArcadeIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">Mechanics</h3>
                                </div>
                                <ul className="space-y-3 text-sm sm:text-base">
                                    {[
                                        'Take turns placing orbs on the grid.',
                                        'Click any empty cell or a cell you already own.',
                                        'When a cell reaches its critical mass, it explodes!',
                                        'Explosions send orbs to adjacent cells and convert them to your color.'
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-slate-600">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center shrink-0 text-xs">{i+1}</span>
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm border border-purple-100">
                                        <ChainReactionIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">Critical Mass</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <span className="font-semibold text-slate-700">Corner cells</span>
                                        <span className="bg-white px-3 py-1 rounded-full shadow-xs text-indigo-600 font-bold">2 orbs</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <span className="font-semibold text-slate-700">Edge cells</span>
                                        <span className="bg-white px-3 py-1 rounded-full shadow-xs text-indigo-600 font-bold">3 orbs</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <span className="font-semibold text-slate-700">Interior cells</span>
                                        <span className="bg-white px-3 py-1 rounded-full shadow-xs text-indigo-600 font-bold">4 orbs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className="w-full py-4 mt-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all duration-300 transform hover:-translate-y-0.5 text-lg flex items-center justify-center cursor-pointer"
                    onClick={() => setScreen('menu')}
                >
                    Got It, Let's Play!
                </button>
            </div>
        </div>
    );
}
