import { useAppStore } from '../store/appStore';

export default function HowToPlay() {
    const setScreen = useAppStore((state) => state.setScreen);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-12 max-w-3xl w-full">
                <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r bg-clip-text text-transparent">
                    How to Play
                </h2>

                <div className="text-slate-700 space-y-6">
                    <section>
                        <h3 className="text-2xl font-bold mb-3 text-slate-800"><span aria-hidden="true">🎯</span><span className="sr-only">Objective:</span> Objective</h3>
                        <p>Be the last player with orbs remaining on the board!</p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold mb-3 text-slate-800"><span aria-hidden="true">🎮</span><span className="sr-only">How to Play:</span> How to Play</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Players take turns placing orbs on the grid</li>
                            <li>Click any empty cell or a cell you already own</li>
                            <li>When a cell reaches its critical mass, it explodes!</li>
                            <li>Explosions send orbs to adjacent cells and convert them to your color</li>
                            <li>Chain reactions can occur when explosions trigger more explosions</li>
                        </ol>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold mb-3 text-slate-800"><span aria-hidden="true">💥</span><span className="sr-only">Critical Mass:</span> Critical Mass</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Corner cells:</strong> 2 orbs</li>
                            <li><strong>Edge cells:</strong> 3 orbs</li>
                            <li><strong>Interior cells:</strong> 4 orbs</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold mb-3 text-slate-800"><span aria-hidden="true">📋</span><span className="sr-only">Rules:</span> Rules</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>You can only place orbs in empty cells or cells you own</li>
                            <li>Players cannot be eliminated in the first round</li>
                            <li>Once you have no orbs left (after round 1), you're eliminated</li>
                            <li>Plan your moves carefully to create powerful chain reactions!</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold mb-3 text-slate-800"><span aria-hidden="true">💡</span><span className="sr-only">Strategy Tips:</span> Strategy Tips</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Control corners and edges early - they explode with fewer orbs</li>
                            <li>Set up chain reactions to capture multiple cells at once</li>
                            <li>Watch your opponents' positions and block their strategies</li>
                            <li>Sometimes defensive play is better than aggressive expansion</li>
                        </ul>
                    </section>
                </div>

                <button
                    className="btn-primary mt-8 max-w-md mx-auto"
                    onClick={() => setScreen('menu')}
                >
                    Back to Menu
                </button>
            </div>
        </div>
    );
}
