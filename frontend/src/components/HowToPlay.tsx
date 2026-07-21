import { useAppStore } from '../store/appStore';

export default function HowToPlay() {
    const setScreen = useAppStore((state) => state.setScreen);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-300/20 blur-[120px] -z-10" />
            
            <div className="bg-white/80 backdrop-blur-xl border border-white p-8 md:p-12 max-w-3xl w-full rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={() => setScreen('menu')}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-medium group"
                >
                    <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Menu
                </button>

                <h2 className="text-4xl md:text-5xl font-black mb-10 text-slate-900 tracking-tight">
                    How to Play
                </h2>

                <div className="space-y-8">
                    {/* Objective */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl shadow-sm border border-indigo-200">
                                🎯
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">Objective</h3>
                        </div>
                        <p className="text-lg text-slate-600 font-medium pl-14">
                            Be the last player with orbs remaining on the board!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Mechanics */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm border border-blue-100">
                                    🎮
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Mechanics</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Take turns placing orbs on the grid.',
                                    'Click any empty cell or a cell you already own.',
                                    'When a cell reaches its critical mass, it explodes!',
                                    'Explosions send orbs to adjacent cells and convert them to your color.',
                                    'Chain reactions can occur when explosions trigger more explosions.'
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center shrink-0 text-sm">{i+1}</span>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Critical Mass */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-xl shadow-sm border border-purple-100">
                                    💥
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Critical Mass</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span className="font-semibold text-slate-700">Corner cells</span>
                                    <span className="bg-white px-3 py-1 rounded-full shadow-sm text-indigo-600 font-bold text-sm">2 orbs</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span className="font-semibold text-slate-700">Edge cells</span>
                                    <span className="bg-white px-3 py-1 rounded-full shadow-sm text-indigo-600 font-bold text-sm">3 orbs</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span className="font-semibold text-slate-700">Interior cells</span>
                                    <span className="bg-white px-3 py-1 rounded-full shadow-sm text-indigo-600 font-bold text-sm">4 orbs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-4">
                        {/* Rules */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl shadow-sm border border-red-100">
                                    📋
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Rules</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'You can only place orbs in empty cells or cells you own.',
                                    'Players cannot be eliminated in the first round.',
                                    'Once you have no orbs left (after round 1), you\'re eliminated.'
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 items-start">
                                        <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Strategy */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-xl shadow-sm border border-amber-100">
                                    💡
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Strategy</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Control corners and edges early - they explode with fewer orbs.',
                                    'Set up chain reactions to capture multiple cells at once.',
                                    'Watch your opponents\' positions and block their strategies.',
                                    'Sometimes defensive play is better than aggressive expansion.'
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 items-start">
                                        <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <button
                    className="w-full py-4 mt-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all duration-300 transform hover:-translate-y-1 text-lg flex items-center justify-center"
                    onClick={() => setScreen('menu')}
                >
                    Got It, Let's Play!
                </button>
            </div>
        </div>
    );
}
