import type { GameState, Grid, Cell, Player, ExplosionStep, RoomSettings, GameMode } from '../../../shared/types';
import { GRID_SIZES } from '../../../shared/types';
import { logger } from '../utils/logger';

const SYMBOLS = ['X', 'O', 'Δ', '□', '★', '◆', '✦', '▲'];

/**
 * Calculate critical mass for a cell based on its position
 */
export function getCriticalMass(row: number, col: number, rows: number, cols: number): number {
    const isCorner = (row === 0 || row === rows - 1) && (col === 0 || col === cols - 1);
    const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;

    if (isCorner) return 2;
    if (isEdge) return 3;
    return 4;
}

/**
 * Initialize an empty grid based on grid size
 */
export function initializeGrid(gridSize: keyof typeof GRID_SIZES): Grid {
    const { rows, cols } = GRID_SIZES[gridSize];
    const cells: Cell[][] = [];

    for (let row = 0; row < rows; row++) {
        cells[row] = [];
        for (let col = 0; col < cols; col++) {
            cells[row][col] = {
                row,
                col,
                orbCount: 0,
                ownerId: null,
                symbol: null,
                criticalMass: getCriticalMass(row, col, rows, cols),
            };
        }
    }

    return { rows, cols, cells };
}

/**
 * Initialize game state for a new game
 */
export function initializeGameState(players: Player[], settings: RoomSettings): GameState {
    // Assign player symbols for XOX mode
    players.forEach((p, i) => {
        p.symbol = SYMBOLS[i % SYMBOLS.length];
    });

    return {
        grid: initializeGrid(settings.gridSize),
        currentTurnIndex: 0,
        roundNumber: 1,
        isGameOver: false,
        isDraw: false,
        winnerId: null,
        turnStartTime: Date.now(),
    };
}

/**
 * Validate if a move is legal
 */
export function isValidMove(
    grid: Grid,
    row: number,
    col: number,
    playerId: string,
    gameMode: string = 'CHAIN_REACTION'
): { valid: boolean; error?: string } {
    // Check bounds
    if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) {
        return { valid: false, error: 'Move out of bounds' };
    }

    const cell = grid.cells[row][col];

    if (gameMode === 'XOX') {
        // In XOX, cell must be completely empty
        if (cell.ownerId !== null || cell.symbol) {
            return { valid: false, error: 'Cell is already occupied' };
        }
    } else {
        // In Chain Reaction, can only place in empty cells or own cells
        if (cell.ownerId !== null && cell.ownerId !== playerId) {
            return { valid: false, error: 'Cannot place orb in opponent\'s cell' };
        }
    }

    return { valid: true };
}

/**
 * Check win condition for XOX (Tic-Tac-Toe)
 */
export function checkXOXWinCondition(grid: Grid): { isGameOver: boolean; winnerId: string | null; isDraw: boolean } {
    const { rows, cols, cells } = grid;
    const winTarget = Math.min(3, Math.min(rows, cols));

    // Helper to check a line of cells
    const checkLine = (line: Cell[]): string | null => {
        if (line.length < winTarget) return null;
        for (let i = 0; i <= line.length - winTarget; i++) {
            const firstOwner = line[i].ownerId;
            if (!firstOwner) continue;
            let match = true;
            for (let j = 1; j < winTarget; j++) {
                if (line[i + j].ownerId !== firstOwner) {
                    match = false;
                    break;
                }
            }
            if (match) return firstOwner;
        }
        return null;
    };

    // Check rows
    for (let r = 0; r < rows; r++) {
        const winner = checkLine(cells[r]);
        if (winner) return { isGameOver: true, winnerId: winner, isDraw: false };
    }

    // Check columns
    for (let c = 0; c < cols; c++) {
        const colCells: Cell[] = [];
        for (let r = 0; r < rows; r++) {
            colCells.push(cells[r][c]);
        }
        const winner = checkLine(colCells);
        if (winner) return { isGameOver: true, winnerId: winner, isDraw: false };
    }

    // Check main diagonals (top-left to bottom-right)
    for (let r = 0; r <= rows - winTarget; r++) {
        for (let c = 0; c <= cols - winTarget; c++) {
            const diag: Cell[] = [];
            for (let i = 0; i < winTarget; i++) {
                diag.push(cells[r + i][c + i]);
            }
            const winner = checkLine(diag);
            if (winner) return { isGameOver: true, winnerId: winner, isDraw: false };
        }
    }

    // Check anti-diagonals (top-right to bottom-left)
    for (let r = 0; r <= rows - winTarget; r++) {
        for (let c = winTarget - 1; c < cols; c++) {
            const diag: Cell[] = [];
            for (let i = 0; i < winTarget; i++) {
                diag.push(cells[r + i][c - i]);
            }
            const winner = checkLine(diag);
            if (winner) return { isGameOver: true, winnerId: winner, isDraw: false };
        }
    }

    // Check for draw (all cells filled)
    let isFull = true;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (cells[r][c].ownerId === null) {
                isFull = false;
                break;
            }
        }
    }

    if (isFull) {
        return { isGameOver: true, winnerId: null, isDraw: true };
    }

    return { isGameOver: false, winnerId: null, isDraw: false };
}

/**
 * Get adjacent cell positions
 */
function getAdjacentPositions(row: number, col: number): Array<{ row: number; col: number }> {
    return [
        { row: row - 1, col }, // up
        { row: row + 1, col }, // down
        { row, col: col - 1 }, // left
        { row, col: col + 1 }, // right
    ];
}

/**
 * Process explosions for Chain Reaction
 */
export function processExplosions(
    grid: Grid,
    playerId: string,
    explosionSequence: ExplosionStep[] = [],
    depth: number = 0
): { grid: Grid; explosionSequence: ExplosionStep[] } {
    if (depth > 100) {
        logger.error('Explosion depth limit exceeded - possible infinite loop detected');
        return { grid, explosionSequence };
    }
    let hasExplosions = false;
    const newCells: Cell[][] = grid.cells.map(row => row.map(cell => ({ ...cell })));

    const explosions: Array<{ row: number; col: number; ownerId: string }> = [];

    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            const cell = newCells[row][col];
            if (cell.orbCount >= cell.criticalMass && cell.ownerId !== null) {
                explosions.push({ row, col, ownerId: cell.ownerId });
                hasExplosions = true;
            }
        }
    }

    for (const explosion of explosions) {
        const { row, col, ownerId } = explosion;
        const baseDelay = 0;

        explosionSequence.push({
            row,
            col,
            type: 'explode',
            ownerId,
            delay: baseDelay,
        });

        newCells[row][col].orbCount = 0;
        newCells[row][col].ownerId = null;

        const adjacent = getAdjacentPositions(row, col);

        for (let i = 0; i < adjacent.length; i++) {
            const adj = adjacent[i];
            if (
                adj.row >= 0 &&
                adj.row < grid.rows &&
                adj.col >= 0 &&
                adj.col < grid.cols
            ) {
                newCells[adj.row][adj.col].orbCount += 1;
                newCells[adj.row][adj.col].ownerId = ownerId;

                explosionSequence.push({
                    row: adj.row,
                    col: adj.col,
                    type: 'add',
                    ownerId,
                    delay: baseDelay,
                    fromRow: row,
                    fromCol: col,
                });
            }
        }
    }

    const newGrid = { ...grid, cells: newCells };

    if (hasExplosions) {
        return processExplosions(newGrid, playerId, explosionSequence, depth + 1);
    }

    return { grid: newGrid, explosionSequence };
}

/**
 * Place a move (orb in Chain Reaction or X/O symbol in XOX)
 */
export function placeOrb(
    gameState: GameState,
    row: number,
    col: number,
    playerId: string,
    playerSymbol?: string,
    gameMode: GameMode = 'CHAIN_REACTION'
): { gameState: GameState; explosionSequence: ExplosionStep[] } {
    const newCells = gameState.grid.cells.map(r => r.map(c => ({ ...c })));

    if (gameMode === 'XOX') {
        newCells[row][col].ownerId = playerId;
        newCells[row][col].symbol = playerSymbol || 'X';
        newCells[row][col].orbCount = 1;

        const newGrid = { ...gameState.grid, cells: newCells };
        const xoxResult = checkXOXWinCondition(newGrid);

        const newGameState: GameState = {
            ...gameState,
            grid: newGrid,
            isGameOver: xoxResult.isGameOver,
            winnerId: xoxResult.winnerId,
            isDraw: xoxResult.isDraw,
        };

        return { gameState: newGameState, explosionSequence: [] };
    }

    // Default Chain Reaction Mode
    newCells[row][col].orbCount += 1;
    newCells[row][col].ownerId = playerId;

    const newGrid = { ...gameState.grid, cells: newCells };
    const { grid: finalGrid, explosionSequence } = processExplosions(newGrid, playerId);

    const newGameState: GameState = {
        ...gameState,
        grid: finalGrid,
    };

    return { gameState: newGameState, explosionSequence };
}

/**
 * Check player elimination for Chain Reaction
 */
export function checkPlayerElimination(
    gameState: GameState,
    players: Player[]
): Player[] {
    if (gameState.roundNumber === 1) {
        return players;
    }

    const playerOrbCounts = new Map<string, number>();

    for (const row of gameState.grid.cells) {
        for (const cell of row) {
            if (cell.ownerId !== null) {
                const currentCount = playerOrbCounts.get(cell.ownerId) || 0;
                playerOrbCounts.set(cell.ownerId, currentCount + cell.orbCount);
            }
        }
    }

    return players.map(player => ({
        ...player,
        orbCount: playerOrbCounts.get(player.id) || 0,
        isActive: gameState.roundNumber === 1 || (playerOrbCounts.get(player.id) || 0) > 0,
    }));
}

/**
 * Check win condition for Chain Reaction
 */
export function checkWinCondition(
    gameState: GameState,
    players: Player[]
): { isGameOver: boolean; winnerId: string | null } {
    if (gameState.roundNumber === 1) {
        return { isGameOver: false, winnerId: null };
    }

    const activePlayers = players.filter(p => p.isActive);

    if (activePlayers.length === 1) {
        return { isGameOver: true, winnerId: activePlayers[0].id };
    }

    return { isGameOver: false, winnerId: null };
}

/**
 * Advance to next player's turn
 */
export function nextTurn(
    gameState: GameState,
    players: Player[]
): { currentTurnIndex: number; roundNumber: number } {
    let currentTurnIndex = gameState.currentTurnIndex;
    let roundNumber = gameState.roundNumber;

    let attempts = 0;
    do {
        currentTurnIndex = (currentTurnIndex + 1) % players.length;
        attempts++;

        if (currentTurnIndex === 0) {
            roundNumber++;
        }

        if (attempts > players.length * 2) {
            break;
        }
    } while (!players[currentTurnIndex].isActive);

    return { currentTurnIndex, roundNumber };
}
