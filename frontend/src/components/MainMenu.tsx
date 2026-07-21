import { useAppStore } from '../store/appStore';

export default function MainMenu() {
    const setScreen = useAppStore((state) => state.setScreen);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-6 md:p-12 max-w-2xl w-full text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-2 md:mb-4 bg-gradient-to-r bg-clip-text text-transparent">
                    Chain Reaction
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-6 md:mb-8">
                    Multiplayer Strategy Game
                </p>
                <div className="flex flex-col gap-3 md:gap-4 max-w-md mx-auto">
                    <button
                        className="btn-primary"
                        onClick={() => setScreen('create-room')}
                    >
                        Create Room
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setScreen('join-room')}
                    >
                        Join Room
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setScreen('how-to-play')}
                    >
                        How to Play
                    </button>
                </div>
                <div className="mt-8 md:mt-12 text-xs md:text-sm text-white/50">
                    <p>Play with 2-8 players across different computers</p>
                </div>
            </div>
        </div>
    );
}
