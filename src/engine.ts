/**
 * Minesweeper Game Engine
 *
 * Pure logic — no React, no DOM.  Every function takes state in and returns
 * state out, which makes the whole thing trivially testable and easy to
 * reason about.
 */

// ============================================================================
// Types
// ============================================================================

export interface Cell {
  /** Does this cell contain a mine? */
  mine: boolean;
  /** Has the player revealed this cell? */
  revealed: boolean;
  /** Has the player placed a flag here? */
  flagged: boolean;
  /** How many of the 8 neighbours are mines (0-8). */
  adjacent: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameState {
  /** 2-D board indexed as board[row][col]. */
  board: Cell[][];
  rows: number;
  cols: number;
  mines: number;
  status: GameStatus;
  /** Number of flags currently placed. */
  flagCount: number;
  /** Number of non-mine cells still hidden. */
  remaining: number;
}

export interface Difficulty {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

// ============================================================================
// Preset difficulties
// ============================================================================

export const DIFFICULTIES: Difficulty[] = [
  { name: 'Beginner',     rows: 9,  cols: 9,  mines: 10 },
  { name: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  { name: 'Expert',       rows: 16, cols: 30, mines: 99 },
];

// ============================================================================
// Board creation
// ============================================================================

/** Create an empty board with no mines. */
function emptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  );
}

/** All 8 neighbours of (r, c) that are within bounds. */
function neighbours(r: number, c: number, rows: number, cols: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

/**
 * Place `count` mines randomly, avoiding `safeRow`/`safeCol` and its
 * immediate neighbours so the first click is always a zero (cascade).
 */
function placeMines(
  board: Cell[][],
  count: number,
  rows: number,
  cols: number,
  safeRow: number,
  safeCol: number,
): void {
  const safeSet = new Set<string>();
  safeSet.add(`${safeRow},${safeCol}`);
  for (const [nr, nc] of neighbours(safeRow, safeCol, rows, cols)) {
    safeSet.add(`${nr},${nc}`);
  }

  let placed = 0;
  while (placed < count) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const cell = board[r]![c]!;
    if (cell.mine || safeSet.has(`${r},${c}`)) continue;
    cell.mine = true;
    placed++;
  }
}

/** Compute adjacency counts for every cell. */
function computeAdjacency(board: Cell[][], rows: number, cols: number): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]![c]!.mine) continue;
      let count = 0;
      for (const [nr, nc] of neighbours(r, c, rows, cols)) {
        if (board[nr]![nc]!.mine) count++;
      }
      board[r]![c]!.adjacent = count;
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/** Create a fresh game. Mines aren't placed until the first reveal. */
export function createGame(rows: number, cols: number, mines: number): GameState {
  const safeMines = Math.min(mines, rows * cols - 9); // leave room for safe zone
  return {
    board: emptyBoard(rows, cols),
    rows,
    cols,
    mines: safeMines,
    status: 'idle',
    flagCount: 0,
    remaining: rows * cols - safeMines,
  };
}

/**
 * Reveal the cell at (row, col).
 *
 * - On the very first reveal, mines are placed (avoiding the clicked cell).
 * - If it's a mine → game over.
 * - If adjacent === 0 → flood-fill reveal neighbours (the satisfying cascade).
 * - Returns a new GameState (immutable — the original isn't mutated).
 */
export function revealCell(state: GameState, row: number, col: number): GameState {
  const { board, rows, cols, mines } = state;

  // Deep-clone the board so we don't mutate the previous state
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  let newStatus = state.status;
  let newRemaining = state.remaining;

  const cell = newBoard[row]![col]!;

  // Ignore clicks on revealed or flagged cells
  if (cell.revealed || cell.flagged) return state;

  // First click: place mines, compute adjacency
  if (newStatus === 'idle') {
    placeMines(newBoard, mines, rows, cols, row, col);
    computeAdjacency(newBoard, rows, cols);
    newStatus = 'playing';
  }

  // Hit a mine — game over
  if (newBoard[row]![col]!.mine) {
    // Reveal all mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newBoard[r]![c]!.mine) {
          newBoard[r]![c]!.revealed = true;
        }
      }
    }
    return { ...state, board: newBoard, status: 'lost', remaining: newRemaining };
  }

  // Flood-fill reveal using BFS
  const queue: [number, number][] = [[row, col]];
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const current = newBoard[r]![c]!;

    if (current.revealed || current.flagged) continue;
    current.revealed = true;
    newRemaining--;

    // If this cell has 0 adjacent mines, reveal its neighbours too
    if (current.adjacent === 0) {
      for (const [nr, nc] of neighbours(r, c, rows, cols)) {
        if (!newBoard[nr]![nc]!.revealed && !newBoard[nr]![nc]!.mine) {
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Check win condition
  if (newRemaining === 0) {
    newStatus = 'won';
    // Auto-flag remaining mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newBoard[r]![c]!.mine && !newBoard[r]![c]!.flagged) {
          newBoard[r]![c]!.flagged = true;
        }
      }
    }
  }

  return {
    ...state,
    board: newBoard,
    status: newStatus,
    remaining: newRemaining,
    flagCount: newStatus === 'won' ? mines : state.flagCount,
  };
}

/** Toggle flag on unrevealed cell. Returns new state. */
export function toggleFlag(state: GameState, row: number, col: number): GameState {
  if (state.status !== 'playing' && state.status !== 'idle') return state;

  const cell = state.board[row]![col]!;
  if (cell.revealed) return state;

  const newBoard = state.board.map(r => r.map(c => ({ ...c })));
  const target = newBoard[row]![col]!;
  target.flagged = !target.flagged;

  return {
    ...state,
    board: newBoard,
    flagCount: state.flagCount + (target.flagged ? 1 : -1),
  };
}

/**
 * "Chord" reveal — when a revealed numbered cell is clicked and the correct
 * number of flags surround it, reveal all non-flagged neighbours.
 * This is the power-move that experienced players use for speed.
 */
export function chordReveal(state: GameState, row: number, col: number): GameState {
  const cell = state.board[row]![col]!;
  if (!cell.revealed || cell.adjacent === 0) return state;

  const nbrs = neighbours(row, col, state.rows, state.cols);
  const flaggedCount = nbrs.filter(([r, c]) => state.board[r]![c]!.flagged).length;

  if (flaggedCount !== cell.adjacent) return state;

  let current = state;
  for (const [nr, nc] of nbrs) {
    if (!current.board[nr]![nc]!.flagged && !current.board[nr]![nc]!.revealed) {
      current = revealCell(current, nr, nc);
    }
  }

  return current;
}
