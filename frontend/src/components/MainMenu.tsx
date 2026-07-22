import { useAppStore } from '../store/appStore';

export default function MainMenu() {
    const setScreen = useAppStore((state) => state.setScreen);

    return (
        <div className="min-h-screen flex flex-col md:flex-row w-full overflow-x-hidden overflow-y-auto">
            {/* Left Side - Brand / Title */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16 lg:p-24 relative overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px]" />
                </div>
                
                <div className="max-w-2xl text-center md:text-left">
                    <div className="inline-block px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm mb-4 sm:mb-6 shadow-sm border border-indigo-200">
                        Version 2.0 Is Here
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6 leading-tight">
                        Chain<br className="hidden sm:inline"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 sm:ml-0 ml-2">
                            Reaction
                        </span>
                    </h1>
                    <p className="text-base sm:text-xl text-slate-600 font-medium max-w-lg leading-relaxed mx-auto md:mx-0">
                        Experience the classic multiplayer strategy game reimagined with a breathtaking modern design. Outsmart your opponents and trigger the ultimate chain reaction.
                    </p>
                </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16 bg-white/50 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/60">
                <div className="w-full max-w-md space-y-4 sm:space-y-6">
                    <button
                        onClick={() => setScreen('create-room')}
                        className="group w-full flex items-center p-4 sm:p-6 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-indigo-300 hover:shadow-[0_8px_40px_rgb(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100 shrink-0">
                            ✨
                        </div>
                        <div className="ml-4 sm:ml-6">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1">Create Room</h3>
                            <p className="text-xs sm:text-sm text-slate-500">Host a new game and invite your friends</p>
                        </div>
                        <div className="ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300 shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>

                    <button
                        onClick={() => setScreen('join-room')}
                        className="group w-full flex items-center p-4 sm:p-6 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-indigo-300 hover:shadow-[0_8px_40px_rgb(99,102,241,0.12)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-50 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-100 shrink-0">
                            🔗
                        </div>
                        <div className="ml-4 sm:ml-6">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1">Join Room</h3>
                            <p className="text-xs sm:text-sm text-slate-500">Enter a code to join an existing game</p>
                        </div>
                        <div className="ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300 shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>

                    <button
                        onClick={() => setScreen('how-to-play')}
                        className="group w-full flex items-center p-4 sm:p-6 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-slate-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-200 shrink-0">
                            📖
                        </div>
                        <div className="ml-4 sm:ml-6">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1">How to Play</h3>
                            <p className="text-xs sm:text-sm text-slate-500">Learn the rules and mechanics</p>
                        </div>
                        <div className="ml-auto text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all duration-300 shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                    
                    <div className="text-center pt-4 sm:pt-8 text-xs sm:text-sm text-slate-400 font-medium">
                        Play with 2-8 players across different computers or phones
                    </div>
                </div>
            </div>
        </div>
    );
}
