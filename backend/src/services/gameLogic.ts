import type { GameState, Grid, Cell, Player, ExplosionStep } from '../../../shared/types';
import { GRID_SIZES } from '../../../shared/types';
import { logger } from '../utils/logger';

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
                criticalMass: getCriticalMass(row, col, rows, cols),
            };
        }
    }

    return { rows, cols, cells };
}

/**
 * Initialize game state for a new game
 */
export function initializeGameState(players: Player[], gridSize: keyof typeof GRID_SIZES): GameState {
    return {
        grid: initializeGrid(gridSize),
        currentTurnIndex: 0,
        roundNumber: 1,
        isGameOver: false,
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
    roundNumber: number
): { valid: boolean; error?: string } {
    // Check bounds
    if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) {
        return { valid: false, error: 'Move out of bounds' };
    }

    const cell = grid.cells[row][col];

    // Can only place in empty cells or own cells
    if (cell.ownerId !== null && cell.ownerId !== playerId) {
        return { valid: false, error: 'Cannot place orb in opponent\'s cell' };
    }

    return { valid: true };
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
 * Process explosions and return the sequence for animations
 */
export function processExplosions(
    grid: Grid,
    playerId: string,
    explosionSequence: ExplosionStep[] = [],
    depth: number = 0
): { grid: Grid; explosionSequence: ExplosionStep[] } {
    // Safety limit to prevent stack overflow
    if (depth > 100) {
        logger.error('Explosion depth limit exceeded - possible infinite loop detected');
        return { grid, explosionSequence };
    }
    let hasExplosions = false;
    const newCells: Cell[][] = grid.cells.map(row => row.map(cell => ({ ...cell })));

    // Find all cells that need to explode
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

    // Process each explosion with sequential timing
    for (const explosion of explosions) {
        const { row, col, ownerId } = explosion;

        // Calculate base delay strictly based on chain reaction depth for sequential popping
        const baseDelay = depth * 500;

        // Record explosion for animation
        explosionSequence.push({
            row,
            col,
            type: 'explode',
            ownerId,
            delay: baseDelay,
        });

        // Reset exploding cell
        newCells[row][col].orbCount = 0;
        newCells[row][col].ownerId = null;

        // Distribute orbs to adjacent cells
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

                // Record orb addition for animation (flying orb)
                explosionSequence.push({
                    row: adj.row,
                    col: adj.col,
                    type: 'add',
                    ownerId,
                    delay: baseDelay + 150, // Orbs start flying shortly after explode starts
                    fromRow: row,
                    fromCol: col,
                });
            }
        }
    }

    const newGrid = { ...grid, cells: newCells };

    // Recursively handle chain reactions
    if (hasExplosions) {
        return processExplosions(newGrid, playerId, explosionSequence, depth + 1);
    }

    return { grid: newGrid, explosionSequence };
}

/**
 * Place an orb and handle all explosions
 */
export function placeOrb(
    gameState: GameState,
    row: number,
    col: number,
    playerId: string
): { gameState: GameState; explosionSequence: ExplosionStep[] } {
    // Create a copy of the grid
    const newCells = gameState.grid.cells.map(r => r.map(c => ({ ...c })));

    // Place the orb
    newCells[row][col].orbCount += 1;
    newCells[row][col].ownerId = playerId;

    const newGrid = { ...gameState.grid, cells: newCells };

    // Process explosions
    const { grid: finalGrid, explosionSequence } = processExplosions(newGrid, playerId);

    // Create new game state
    const newGameState: GameState = {
        ...gameState,
        grid: finalGrid,
    };

    return { gameState: newGameState, explosionSequence };
}

/**
 * Check if any players should be eliminated (have no orbs on the board)
 * Players can only be eliminated after the first round (everyone has had a turn)
 */
export function checkPlayerElimination(
    gameState: GameState,
    players: Player[]
): Player[] {
    // Don't eliminate in first round
    if (gameState.roundNumber === 1) {
        return players;
    }

    const playerOrbCounts = new Map<string, number>();

    // Count orbs for each player
    for (const row of gameState.grid.cells) {
        for (const cell of row) {
            if (cell.ownerId !== null) {
                const currentCount = playerOrbCounts.get(cell.ownerId) || 0;
                playerOrbCounts.set(cell.ownerId, currentCount + cell.orbCount);
            }
        }
    }

    // Update player active status and orb counts
    return players.map(player => ({
        ...player,
        orbCount: playerOrbCounts.get(player.id) || 0,
        isActive: gameState.roundNumber === 1 || (playerOrbCounts.get(player.id) || 0) > 0,
    }));
}

/**
 * Check if the game is over (only one player has orbs remaining)
 */
export function checkWinCondition(
    gameState: GameState,
    players: Player[]
): { isGameOver: boolean; winnerId: string | null } {
    // Game can only end after first round
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

    // Find next active player
    let attempts = 0;
    do {
        currentTurnIndex = (currentTurnIndex + 1) % players.length;
        attempts++;

        // If we've cycled through all players, increment round
        if (currentTurnIndex === 0) {
            roundNumber++;
        }

        // Safety check to prevent infinite loops
        if (attempts > players.length * 2) {
            break;
        }
    } while (!players[currentTurnIndex].isActive);

    return { currentTurnIndex, roundNumber };
}
