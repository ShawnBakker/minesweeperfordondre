import { describe, it, expect } from 'vitest';
import {
  createGame,
  revealCell,
  toggleFlag,
  chordReveal,
  DIFFICULTIES,
  type GameState,
} from '../engine';

// ============================================================================
// Helpers
// ============================================================================

/** Count how many cells on the board satisfy a predicate. */
function countCells(game: GameState, pred: (c: GameState['board'][0][0]) => boolean): number {
  let n = 0;
  for (const row of game.board) {
    for (const cell of row) {
      if (pred(cell)) n++;
    }
  }
  return n;
}

/** Reveal cell (0,0) to trigger mine placement, then return the state. */
function startGame(rows = 9, cols = 9, mines = 10): GameState {
  const game = createGame(rows, cols, mines);
  return revealCell(game, 0, 0);
}

// ============================================================================
// createGame
// ============================================================================

describe('createGame', () => {
  it('creates a board with the correct dimensions', () => {
    const game = createGame(9, 9, 10);
    expect(game.board).toHaveLength(9);
    expect(game.board[0]).toHaveLength(9);
  });

  it('starts in idle status with zero flags', () => {
    const game = createGame(9, 9, 10);
    expect(game.status).toBe('idle');
    expect(game.flagCount).toBe(0);
  });

  it('has no mines before the first reveal', () => {
    const game = createGame(9, 9, 10);
    const mineCount = countCells(game, c => c.mine);
    expect(mineCount).toBe(0);
  });

  it('calculates remaining as total cells minus mines', () => {
    const game = createGame(9, 9, 10);
    expect(game.remaining).toBe(9 * 9 - 10);
  });

  it('caps mines so there is room for a safe zone', () => {
    // Try to create a board with more mines than cells allow
    const game = createGame(3, 3, 100);
    // 3×3 = 9 cells, safe zone = 9 cells, so 0 mines
    expect(game.mines).toBe(0);
  });
});

// ============================================================================
// revealCell — mine placement on first click
// ============================================================================

describe('revealCell — first click', () => {
  it('places the correct number of mines after first reveal', () => {
    const game = startGame(9, 9, 10);
    const mineCount = countCells(game, c => c.mine);
    expect(mineCount).toBe(10);
  });

  it('transitions status from idle to playing', () => {
    const game = createGame(9, 9, 10);
    expect(game.status).toBe('idle');
    const next = revealCell(game, 4, 4);
    expect(next.status).toBe('playing');
  });

  it('guarantees the first click cell is NOT a mine', () => {
    // Run this many times to get statistical confidence
    for (let i = 0; i < 50; i++) {
      const game = startGame(9, 9, 10);
      expect(game.board[0]![0]!.mine).toBe(false);
      expect(game.board[0]![0]!.revealed).toBe(true);
    }
  });

  it('guarantees the neighbours of the first click are not mines', () => {
    for (let i = 0; i < 50; i++) {
      const game = startGame(9, 9, 10);
      // (0,0) has neighbours (0,1), (1,0), (1,1)
      expect(game.board[0]![1]!.mine).toBe(false);
      expect(game.board[1]![0]!.mine).toBe(false);
      expect(game.board[1]![1]!.mine).toBe(false);
    }
  });
});

// ============================================================================
// revealCell — flood fill
// ============================================================================

describe('revealCell — flood fill', () => {
  it('reveals multiple cells when clicking a zero-adjacent cell', () => {
    // With a safe zone around (0,0) and only 10 mines on a 9×9 board,
    // the first click almost always cascades to reveal more than 1 cell.
    const game = startGame(9, 9, 10);
    const revealedCount = countCells(game, c => c.revealed);
    expect(revealedCount).toBeGreaterThan(1);
  });

  it('does not reveal mines during flood fill', () => {
    const game = startGame(9, 9, 10);
    for (const row of game.board) {
      for (const cell of row) {
        if (cell.mine) {
          expect(cell.revealed).toBe(false);
        }
      }
    }
  });

  it('ignores clicks on already-revealed cells', () => {
    const game = startGame(9, 9, 10);
    // Click the same cell again — state should be identical
    const next = revealCell(game, 0, 0);
    expect(next).toBe(game); // same reference = no change
  });
});

// ============================================================================
// revealCell — hitting a mine
// ============================================================================

describe('revealCell — mine hit', () => {
  it('sets status to lost when a mine is revealed', () => {
    const game = startGame(9, 9, 10);

    // Find a mine and click it
    let lostGame: GameState | null = null;
    outer: for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r]![c]!.mine) {
          lostGame = revealCell(game, r, c);
          break outer;
        }
      }
    }

    expect(lostGame).not.toBeNull();
    expect(lostGame!.status).toBe('lost');
  });

  it('reveals all mines when the game is lost', () => {
    const game = startGame(9, 9, 10);

    // Find and click a mine
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r]![c]!.mine) {
          const lost = revealCell(game, r, c);
          const revealedMines = countCells(lost, cell => cell.mine && cell.revealed);
          expect(revealedMines).toBe(10);
          return;
        }
      }
    }
  });
});

// ============================================================================
// revealCell — winning
// ============================================================================

describe('revealCell — win condition', () => {
  it('sets status to won when all non-mine cells are revealed', () => {
    // Use a tiny board so we can manually reveal everything
    const game = createGame(3, 3, 0); // No mines at all
    const after = revealCell(game, 1, 1);
    // With zero mines, the flood fill reveals the entire board
    expect(after.status).toBe('won');
    expect(after.remaining).toBe(0);
  });
});

// ============================================================================
// toggleFlag
// ============================================================================

describe('toggleFlag', () => {
  it('places a flag on an unrevealed cell', () => {
    const game = startGame(9, 9, 10);
    // Find an unrevealed, non-mine cell to flag
    let target: [number, number] | null = null;
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (!game.board[r]![c]!.revealed) {
          target = [r, c];
          break;
        }
      }
      if (target) break;
    }

    expect(target).not.toBeNull();
    const [r, c] = target!;
    const flagged = toggleFlag(game, r, c);
    expect(flagged.board[r]![c]!.flagged).toBe(true);
    expect(flagged.flagCount).toBe(game.flagCount + 1);
  });

  it('removes a flag when toggled again', () => {
    const game = startGame(9, 9, 10);
    // Find unrevealed cell
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (!game.board[r]![c]!.revealed) {
          const flagged = toggleFlag(game, r, c);
          const unflagged = toggleFlag(flagged, r, c);
          expect(unflagged.board[r]![c]!.flagged).toBe(false);
          expect(unflagged.flagCount).toBe(game.flagCount);
          return;
        }
      }
    }
  });

  it('prevents revealing a flagged cell', () => {
    const game = startGame(9, 9, 10);
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (!game.board[r]![c]!.revealed) {
          const flagged = toggleFlag(game, r, c);
          const after = revealCell(flagged, r, c);
          // Should be unchanged — flagged cells can't be revealed
          expect(after).toBe(flagged);
          return;
        }
      }
    }
  });

  it('does nothing when game is lost', () => {
    const game = startGame(9, 9, 10);
    // Lose the game
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.board[r]![c]!.mine) {
          const lost = revealCell(game, r, c);
          const after = toggleFlag(lost, 0, 0);
          expect(after).toBe(lost);
          return;
        }
      }
    }
  });
});

// ============================================================================
// chordReveal
// ============================================================================

describe('chordReveal', () => {
  it('does nothing on unrevealed cells', () => {
    const game = startGame(9, 9, 10);
    // Find an unrevealed cell
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (!game.board[r]![c]!.revealed) {
          const after = chordReveal(game, r, c);
          expect(after).toBe(game);
          return;
        }
      }
    }
  });

  it('does nothing when flag count does not match adjacent count', () => {
    const game = startGame(9, 9, 10);
    // Find a revealed cell with adjacent > 0
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        const cell = game.board[r]![c]!;
        if (cell.revealed && cell.adjacent > 0) {
          // No flags placed, so chord should do nothing
          const after = chordReveal(game, r, c);
          expect(after).toBe(game);
          return;
        }
      }
    }
  });
});

// ============================================================================
// Difficulties
// ============================================================================

describe('DIFFICULTIES', () => {
  it('has three preset levels', () => {
    expect(DIFFICULTIES).toHaveLength(3);
  });

  it('each level has valid dimensions', () => {
    for (const d of DIFFICULTIES) {
      expect(d.rows).toBeGreaterThan(0);
      expect(d.cols).toBeGreaterThan(0);
      expect(d.mines).toBeGreaterThan(0);
      expect(d.mines).toBeLessThan(d.rows * d.cols);
    }
  });
});

// ============================================================================
// Immutability
// ============================================================================

describe('immutability', () => {
  it('revealCell does not mutate the original state', () => {
    const game = createGame(9, 9, 10);
    const boardBefore = JSON.stringify(game.board);
    revealCell(game, 0, 0);
    expect(JSON.stringify(game.board)).toBe(boardBefore);
    expect(game.status).toBe('idle');
  });

  it('toggleFlag does not mutate the original state', () => {
    const game = startGame(9, 9, 10);
    const flagCountBefore = game.flagCount;
    // Find unrevealed cell
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (!game.board[r]![c]!.revealed) {
          toggleFlag(game, r, c);
          expect(game.flagCount).toBe(flagCountBefore);
          expect(game.board[r]![c]!.flagged).toBe(false);
          return;
        }
      }
    }
  });
});
