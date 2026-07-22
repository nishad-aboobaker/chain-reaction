import { useEffect, useState, useRef } from 'react';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import CellComponent from './Cell';
import gsap from 'gsap';
import type { Grid as GridType, ExplosionStep } from '../../../shared/types';

interface FlyingOrb {
    id: string;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    ownerColor: string | null;
}

export default function Grid() {
    const { gameState, room, isMyTurn, explosionSequence, clearExplosionSequence } = useMultiplayerStore();
    
    const [displayGrid, setDisplayGrid] = useState<GridType | null>(null);
    const [flyingOrbs, setFlyingOrbs] = useState<FlyingOrb[]>([]);
    const [explodingCells, setExplodingCells] = useState<Set<string>>(new Set());
    const isAnimatingRef = useRef(false);

    // Sync initial state or when no animation is running
    useEffect(() => {
        if (!gameState) return;
        
        if (!isAnimatingRef.current && explosionSequence.length === 0) {
            setDisplayGrid(JSON.parse(JSON.stringify(gameState.grid)));
        }
    }, [gameState, explosionSequence]);

    // Handle Explosion Sequence with GSAP
    useEffect(() => {
        if (explosionSequence.length === 0 || !displayGrid || !room) return;
        
        isAnimatingRef.current = true;
        const timeline = gsap.timeline({
            onComplete: () => {
                // When animation completes, force sync to actual game state to prevent desync
                if (gameState) {
                    setDisplayGrid(JSON.parse(JSON.stringify(gameState.grid)));
                }
                isAnimatingRef.current = false;
                clearExplosionSequence();
            }
        });

        // Create a deep copy of the grid for mutable updates during the timeline callbacks
        const mutableGrid = JSON.parse(JSON.stringify(displayGrid)) as GridType;

        // Group by delays
        const groupedSteps: Record<number, ExplosionStep[]> = {};
        explosionSequence.forEach(step => {
            if (!groupedSteps[step.delay]) groupedSteps[step.delay] = [];
            groupedSteps[step.delay].push(step);
        });

        const delays = Object.keys(groupedSteps).map(Number).sort((a, b) => a - b);
        let previousDelay = 0;

        delays.forEach(delay => {
            const steps = groupedSteps[delay];
            const timeDiff = (delay - previousDelay) / 1000; // GSAP uses seconds
            previousDelay = delay;

            // Advance timeline by the difference
            timeline.add(() => {
                const newExploding = new Set<string>();
                
                steps.forEach(step => {
                    const cellKey = `${step.row}-${step.col}`;
                    
                    if (step.type === 'explode') {
                        // Cell explodes: orb count hits 0 instantly
                        mutableGrid.cells[step.row][step.col].orbCount = 0;
                        mutableGrid.cells[step.row][step.col].ownerId = null;
                        newExploding.add(cellKey);
                    } else if (step.type === 'add' && step.fromRow !== undefined && step.fromCol !== undefined) {
                        // Spawn a flying orb
                        const ownerColor = room.players.find(p => p.id === step.ownerId)?.color || '#fff';
                        const orbId = `fly-${step.fromRow}-${step.fromCol}-to-${step.row}-${step.col}-${Date.now()}-${Math.random()}`;
                        
                        setFlyingOrbs(prev => [...prev, {
                            id: orbId,
                            fromRow: step.fromRow!,
                            fromCol: step.fromCol!,
                            toRow: step.row,
                            toCol: step.col,
                            ownerColor
                        }]);

                        // Wait for fly animation (0.35s) then update destination cell
                        gsap.delayedCall(0.35, () => {
                            mutableGrid.cells[step.row][step.col].orbCount += 1;
                            mutableGrid.cells[step.row][step.col].ownerId = step.ownerId;
                            
                            setFlyingOrbs(prev => prev.filter(o => o.id !== orbId));
                            
                            // Trigger React re-render of grid
                            setDisplayGrid(JSON.parse(JSON.stringify(mutableGrid)));
                        });
                    }
                });

                setExplodingCells(newExploding);
                setDisplayGrid(JSON.parse(JSON.stringify(mutableGrid)));

                // Clear explode effect after a bit
                if (newExploding.size > 0) {
                    gsap.delayedCall(0.5, () => setExplodingCells(new Set()));
                }

            }, `+=${timeDiff}`);
        });

        // Pad the timeline to wait for the final flying orbs to land (they take 0.35s)
        timeline.add(() => {}, "+=0.5");

        return () => {
            timeline.kill();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [explosionSequence]);

    if (!gameState || !room || !displayGrid) {
        return <div className="text-slate-500 font-medium animate-pulse text-sm sm:text-base">Loading grid...</div>;
    }

    const currentPlayer = room.players[gameState.currentTurnIndex];
    const myTurn = isMyTurn();

    const handleCellClick = (row: number, col: number) => {
        if (!myTurn || gameState.isGameOver || isAnimatingRef.current) return;
        const cell = displayGrid.cells[row][col];
        if (cell.ownerId !== null && cell.ownerId !== currentPlayer.id) return;
        socketService.placeOrb(row, col);
    };

    return (
        <div className="relative bg-white/80 backdrop-blur-xl p-2.5 sm:p-4 md:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 w-full max-w-[850px] mx-auto">
            {/* GSAP Flying Orbs Overlay */}
            {flyingOrbs.map(orb => (
                <GSAPFlyingOrb key={orb.id} orb={orb} cols={displayGrid.cols} rows={displayGrid.rows} />
            ))}

            <div
                className="grid gap-1.5 sm:gap-2.5 md:gap-4 relative z-10 w-full"
                style={{
                    gridTemplateColumns: `repeat(${displayGrid.cols}, minmax(0, 1fr))`,
                }}
            >
                {displayGrid.cells.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                        const cellOwner = room.players.find(p => p.id === cell.ownerId);
                        const isCurrentPlayerCell = cell.ownerId === currentPlayer?.id;
                        const cellKey = `${rowIndex}-${colIndex}`;

                        return (
                            <CellComponent
                                key={cellKey}
                                cell={cell}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                isCurrentPlayerCell={isCurrentPlayerCell}
                                currentPlayerColor={currentPlayer?.color || null}
                                ownerColor={cellOwner?.color || null}
                                disabled={!myTurn || gameState.isGameOver || isAnimatingRef.current}
                                isExploding={explodingCells.has(cellKey)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Global Flying Orb rendered via GSAP
function GSAPFlyingOrb({ orb, cols, rows }: { orb: FlyingOrb, cols: number, rows: number }) {
    const orbRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!orbRef.current) return;
        
        const dx = orb.toCol - orb.fromCol;
        const dy = orb.toRow - orb.fromRow;

        // Animate from cell center to target cell center
        gsap.fromTo(orbRef.current, 
            { 
                x: 0, 
                y: 0, 
                scale: 0.5,
                opacity: 0.8
            }, 
            { 
                x: `calc(${dx * 100}% + ${dx * 0.5}rem)`,
                y: `calc(${dy * 100}% + ${dy * 0.5}rem)`,
                scale: 1,
                opacity: 1,
                duration: 0.35,
                ease: 'power2.inOut',
            }
        );
    }, [orb]);

    const widthPct = 100 / cols;
    const heightPct = 100 / rows;
    
    return (
        <div 
            className="absolute z-50 flex items-center justify-center pointer-events-none"
            style={{
                left: `${orb.fromCol * widthPct}%`,
                top: `${orb.fromRow * heightPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                padding: '8%'
            }}
        >
            <div 
                ref={orbRef}
                className="rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.5)] w-[40%] h-[40%]"
                style={{
                    backgroundColor: orb.ownerColor || '#fff',
                    backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, ${orb.ownerColor || '#fff'} 40%, rgba(0,0,0,0.1) 100%)`
                }}
            />
        </div>
    );
}
