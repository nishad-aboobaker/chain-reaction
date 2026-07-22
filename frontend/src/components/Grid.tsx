import { useMultiplayerStore } from '../store/multiplayerStore';
import { socketService } from '../services/socketService';
import CellComponent from './Cell';

export default function Grid() {
    const { gameState, room, isMyTurn } = useMultiplayerStore();

    if (!gameState || !room) {
        return <div className="text-slate-500 font-medium animate-pulse text-sm sm:text-base">Loading grid...</div>;
    }

    const { grid } = gameState;
    const currentPlayer = room.players[gameState.currentTurnIndex];
    const myTurn = isMyTurn();

    const handleCellClick = (row: number, col: number) => {
        if (!myTurn || gameState.isGameOver) return;
        const cell = grid.cells[row][col];
        if (cell.ownerId !== null && cell.ownerId !== currentPlayer.id) return;
        socketService.placeOrb(row, col);
    };

    return (
        <div className="relative bg-white/90 backdrop-blur-md p-1.5 sm:p-3 md:p-5 rounded-xl sm:rounded-3xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] border border-slate-200/80 w-full max-w-[750px] mx-auto flex items-center justify-center">
            <div
                className="grid gap-1 sm:gap-2 relative z-10 w-full"
                style={{
                    gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                }}
            >
                {grid.cells.map((row, rowIndex) =>
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
                                disabled={!myTurn || gameState.isGameOver}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
