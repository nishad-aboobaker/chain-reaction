import { create } from 'zustand';

// Local game types (simpler than shared types for frontend use)
export interface GameCell {
    row: number;
    col: number;
    orbs: number;
    owner: string | null;
    criticalMass: number;
}

export interface GamePlayer {
    id: string;
    name: string;
    color: string;
    isActive: boolean;
    orbCount: number;
}

interface GameStore {
    // State
    grid: GameCell[][];
    players: GamePlayer[];
    currentPlayerIndex: number;
    isGameOver: boolean;
    winner: string | null;
    moveCount: number;

    // Actions
    initializeGame: (rows: number, cols: number, playerCount: number) => void;
    placeOrb: (row: number, col: number) => void;
    resetGame: () => void;
}

// Helper function to calculate critical mass
const getCriticalMass = (row: number, col: number, rows: number, cols: number): number => {
    const isCorner = (row === 0 || row === rows - 1) && (col === 0 || col === cols - 1);
    const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;

    if (isCorner) return 2;
    if (isEdge) return 3;
    return 4;
};

// Helper function to create empty grid
const createEmptyGrid = (rows: number, cols: number): GameCell[][] => {
    const grid: GameCell[][] = [];
    for (let row = 0; row < rows; row++) {
        grid[row] = [];
        for (let col = 0; col < cols; col++) {
            grid[row][col] = {
                row,
                col,
                orbs: 0,
                owner: null,
                criticalMass: getCriticalMass(row, col, rows, cols),
            };
        }
    }
    return grid;
};

// Helper function to create players
const createPlayers = (count: number): GamePlayer[] => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink'];
    const players: GamePlayer[] = [];

    for (let i = 0; i < count; i++) {
        players.push({
            id: `player-${i + 1}`,
            name: `Player ${i + 1}`,
            color: colors[i],
            isActive: true,
            orbCount: 0,
        });
    }

    return players;
};

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    grid: createEmptyGrid(6, 9), // Default medium grid
    players: createPlayers(2),
    currentPlayerIndex: 0,
    isGameOver: false,
    winner: null,
    moveCount: 0,

    // Initialize new game
    initializeGame: (rows: number, cols: number, playerCount: number) => {
        set({
            grid: createEmptyGrid(rows, cols),
            players: createPlayers(playerCount),
            currentPlayerIndex: 0,
            isGameOver: false,
            winner: null,
            moveCount: 0,
        });
    },

    // Place orb with explosion logic
    placeOrb: (row: number, col: number) => {
        const state = get();
        const { grid, players, currentPlayerIndex, isGameOver } = state;

        if (isGameOver) return;

        const cell = grid[row][col];
        const currentPlayer = players[currentPlayerIndex];

        // Validate move: can only place in empty cells or own cells
        if (cell.owner !== null && cell.owner !== currentPlayer.id) {
            return;
        }

        // Create new grid with updated cell
        let newGrid = grid.map(r => r.map(c => ({ ...c })));
        newGrid[row][col] = {
            ...cell,
            orbs: cell.orbs + 1,
            owner: currentPlayer.id,
        };

        // Handle explosions
        const explodeCells = (grid: GameCell[][], depth: number = 0): GameCell[][] => {
            if (depth > 100) return grid;
            let hasExplosions = false;
            const nextGrid = grid.map(r => r.map(c => ({ ...c })));

            // Find all cells that need to explode
            const explosions: { row: number; col: number; owner: string }[] = [];

            for (let r = 0; r < nextGrid.length; r++) {
                for (let c = 0; c < nextGrid[r].length; c++) {
                    const cell = nextGrid[r][c];
                    if (cell.orbs >= cell.criticalMass && cell.owner !== null) {
                        explosions.push({ row: r, col: c, owner: cell.owner });
                        hasExplosions = true;
                    }
                }
            }

            // Process all explosions
            for (const explosion of explosions) {
                const { row: r, col: c, owner } = explosion;

                // Reset exploding cell
                nextGrid[r][c].orbs = 0;
                nextGrid[r][c].owner = null;

                // Get adjacent cells (up, down, left, right)
                const adjacent = [
                    { row: r - 1, col: c }, // up
                    { row: r + 1, col: c }, // down
                    { row: r, col: c - 1 }, // left
                    { row: r, col: c + 1 }, // right
                ];

                // Distribute orbs to adjacent cells
                for (const adj of adjacent) {
                    if (
                        adj.row >= 0 &&
                        adj.row < nextGrid.length &&
                        adj.col >= 0 &&
                        adj.col < nextGrid[0].length
                    ) {
                        nextGrid[adj.row][adj.col].orbs += 1;
                        nextGrid[adj.row][adj.col].owner = owner;
                    }
                }
            }

            // Recursively handle chain reactions
            if (hasExplosions) {
                return explodeCells(nextGrid, depth + 1);
            }

            return nextGrid;
        };

        // Apply explosions
        newGrid = explodeCells(newGrid);

        // Move to next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

        set({
            grid: newGrid,
            currentPlayerIndex: nextPlayerIndex,
            moveCount: state.moveCount + 1,
        });
    },

    // Reset game
    resetGame: () => {
        const state = get();
        set({
            grid: createEmptyGrid(state.grid.length, state.grid[0].length),
            currentPlayerIndex: 0,
            isGameOver: false,
            winner: null,
            moveCount: 0,
            players: state.players.map(p => ({ ...p, isActive: true, orbCount: 0 })),
        });
    },
}));
