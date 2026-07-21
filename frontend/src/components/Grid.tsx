import { useEffect, useState } from 'react';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import CellComponent from './Cell';

export default function Grid() {
    const { gameState, room, isMyTurn, explosionSequence, clearExplosionSequence } = useMultiplayerStore();
    const [animatingCells, setAnimatingCells] = useState<Map<string, 'explode' | 'add'>>(new Map());

    // Process explosion sequence
    useEffect(() => {
        if (explosionSequence.length === 0) return;

        // Clear any existing animations
        setAnimatingCells(new Map());

        // Process each explosion step with delays
        explosionSequence.forEach((step) => {
            setTimeout(() => {
                setAnimatingCells((prev) => {
                    const next = new Map(prev);
                    const key = `${step.row}-${step.col}`;
                    next.set(key, step.type);
                    return next;
                });

                // Remove animation after it completes
                setTimeout(() => {
                    setAnimatingCells((prev) => {
                        const next = new Map(prev);
                        next.delete(`${step.row}-${step.col}`);
                        return next;
                    });
                }, step.type === 'explode' ? 500 : 400);
            }, step.delay);
        });

        // Clear explosion sequence after all animations complete
        const maxDelay = Math.max(...explosionSequence.map(s => s.delay)) + 600;
        setTimeout(() => {
            clearExplosionSequence();
            setAnimatingCells(new Map());
        }, maxDelay);
    }, [explosionSequence, clearExplosionSequence]);

    if (!gameState || !room) {
        return <div className="text-slate-500 font-medium animate-pulse">Loading grid...</div>;
    }

    const { grid } = gameState;
    const currentPlayer = room.players[gameState.currentTurnIndex];
    const myTurn = isMyTurn();

    const handleCellClick = (row: number, col: number) => {
        // Only allow placing orb if it's my turn and game is not over
        if (!myTurn || gameState.isGameOver) return;

        const cell = grid.cells[row][col];

        // Can only place in empty cells or own cells
        if (cell.ownerId !== null && cell.ownerId !== currentPlayer.id) {
            return;
        }

        socketService.placeOrb(row, col);
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl p-4 md:p-6 lg:p-8 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60">
            <div
                className="grid gap-2 sm:gap-3 lg:gap-4"
                style={{
                    gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                    width: '100%',
                    maxWidth: '850px',
                    aspectRatio: `${grid.cols} / ${grid.rows}`
                }}
            >
                {grid.cells.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                        const cellOwner = room.players.find(p => p.id === cell.ownerId);
                        const isCurrentPlayerCell = cell.ownerId === currentPlayer?.id;
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const animationType = animatingCells.get(cellKey);

                        return (
                            <CellComponent
                                key={cellKey}
                                cell={cell}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                isCurrentPlayerCell={isCurrentPlayerCell}
                                currentPlayerColor={currentPlayer?.color || null}
                                ownerColor={cellOwner?.color || null}
                                disabled={!myTurn || gameState.isGameOver}
                                isExploding={animationType === 'explode'}
                                isAdding={animationType === 'add'}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
