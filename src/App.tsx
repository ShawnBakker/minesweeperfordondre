import { useState, useCallback } from 'react';
import {
  createGame,
  revealCell,
  toggleFlag,
  chordReveal,
  DIFFICULTIES,
  type GameState,
  type Cell,
  type Difficulty,
} from './engine';
import { useTimer } from './useTimer';

// ============================================================================
// Number → colour map  (the classic minesweeper colour scheme, dark-mode tuned)
// ============================================================================

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-red-400',
  4: 'text-purple-400',
  5: 'text-amber-500',
  6: 'text-cyan-400',
  7: 'text-pink-400',
  8: 'text-gray-300',
};

// ============================================================================
// Sub-components
// ============================================================================

function Stat({ label, value, color = 'text-accent-cyan' }: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
        {label}
      </span>
      <span className={`text-xl font-mono font-bold tabular-nums ${color}`}>
        {String(value).padStart(3, '0')}
      </span>
    </div>
  );
}

function CellButton({
  cell,
  row,
  col,
  gameOver,
  onReveal,
  onFlag,
  onChord,
  size,
}: {
  cell: Cell;
  row: number;
  col: number;
  gameOver: boolean;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
  onChord: (r: number, c: number) => void;
  size: number;
}) {
  const handleClick = () => {
    if (gameOver) return;
    if (cell.revealed) {
      onChord(row, col);
    } else {
      onReveal(row, col);
    }
  };

  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver || cell.revealed) return;
    onFlag(row, col);
  };

  // --- Determine cell appearance ---
  let className = 'cell-btn no-select ';
  let content: React.ReactNode = null;

  if (cell.revealed) {
    className += 'revealed ';
    if (cell.mine) {
      className += 'mine-hit ';
      content = (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-accent-red" aria-label="mine">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-red" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-red" />
          <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-red" />
          <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-red" />
        </svg>
      );
    } else if (cell.adjacent > 0) {
      className += `animate-reveal ${NUMBER_COLORS[cell.adjacent] ?? 'text-gray-400'} `;
      content = cell.adjacent;
    }
  } else if (cell.flagged) {
    className += 'flagged ';
    content = <span className="text-accent-amber text-sm" aria-label="flag">⚑</span>;
  } else {
    className += 'unrevealed ';
  }

  return (
    <button
      className={className}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      onClick={handleClick}
      onContextMenu={handleContext}
      data-testid={`cell-${row}-${col}`}
      aria-label={
        cell.revealed
          ? cell.mine ? 'mine' : `${cell.adjacent} adjacent mines`
          : cell.flagged ? 'flagged' : 'hidden'
      }
    >
      {content}
    </button>
  );
}

// ============================================================================
// Main App
// ============================================================================

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]!);
  const [game, setGame] = useState<GameState>(() =>
    createGame(difficulty.rows, difficulty.cols, difficulty.mines),
  );
  const timer = useTimer(game.status);

  const resetGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setGame(createGame(d.rows, d.cols, d.mines));
  }, []);

  const handleReveal = useCallback((r: number, c: number) => {
    setGame(prev => revealCell(prev, r, c));
  }, []);

  const handleFlag = useCallback((r: number, c: number) => {
    setGame(prev => toggleFlag(prev, r, c));
  }, []);

  const handleChord = useCallback((r: number, c: number) => {
    setGame(prev => chordReveal(prev, r, c));
  }, []);

  const gameOver = game.status === 'won' || game.status === 'lost';
  const minesLeft = game.mines - game.flagCount;

  // Responsive cell sizing
  const cellSize = difficulty.name === 'Expert' ? 28 : difficulty.name === 'Intermediate' ? 32 : 36;

  return (
    <div className="min-h-screen bg-surface-900 grid-bg scanlines flex flex-col items-center justify-center p-4 gap-6">

      {/* ── Title ── */}
      <header className="text-center animate-float-in">
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-wider text-accent-cyan drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
          MINESWEEPER
        </h1>
        <p className="font-mono text-xs text-gray-500 mt-1 tracking-widest">
          TERMINAL v1.0 // RIGHT-CLICK TO FLAG
        </p>
      </header>

      {/* ── Difficulty selector ── */}
      <nav className="flex gap-2" role="tablist" aria-label="Difficulty">
        {DIFFICULTIES.map(d => (
          <button
            key={d.name}
            role="tab"
            aria-selected={d.name === difficulty.name}
            onClick={() => resetGame(d)}
            className={`
              px-4 py-1.5 rounded font-mono text-xs font-semibold uppercase tracking-wider
              transition-all duration-200 border
              ${d.name === difficulty.name
                ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/40 shadow-glow'
                : 'bg-surface-700 text-gray-400 border-surface-600 hover:border-gray-500 hover:text-gray-300'
              }
            `}
          >
            {d.name}
          </button>
        ))}
      </nav>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-8 bg-surface-800 border border-surface-600 rounded-lg px-6 py-3">
        <Stat label="Mines" value={minesLeft} color="text-accent-red" />

        {/* Reset / face button */}
        <button
          onClick={() => resetGame(difficulty)}
          className="text-2xl hover:scale-110 active:scale-95 transition-transform"
          aria-label="New game"
          data-testid="reset-btn"
        >
          {game.status === 'won' ? '😎' : game.status === 'lost' ? '💀' : '🙂'}
        </button>

        <Stat label="Time" value={timer} color="text-accent-green" />
      </div>

      {/* ── Board ── */}
      <div
        className={`
          inline-grid rounded-lg overflow-hidden border border-surface-600
          bg-surface-800/50 shadow-lg
          ${game.status === 'lost' ? 'animate-shake' : ''}
        `}
        style={{
          gridTemplateColumns: `repeat(${game.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${game.rows}, ${cellSize}px)`,
        }}
        onContextMenu={e => e.preventDefault()}
        role="grid"
        aria-label="Minesweeper board"
        data-testid="board"
      >
        {game.board.map((row, r) =>
          row.map((cell, c) => (
            <CellButton
              key={`${r}-${c}`}
              cell={cell}
              row={r}
              col={c}
              gameOver={gameOver}
              onReveal={handleReveal}
              onFlag={handleFlag}
              onChord={handleChord}
              size={cellSize}
            />
          )),
        )}
      </div>

      {/* ── Game over overlay ── */}
      {gameOver && (
        <div className="animate-float-in text-center">
          <p className={`
            font-display text-2xl font-bold tracking-widest
            ${game.status === 'won'
              ? 'text-accent-green drop-shadow-[0_0_15px_rgba(0,230,118,0.4)]'
              : 'text-accent-red drop-shadow-[0_0_15px_rgba(255,61,87,0.4)]'
            }
          `}>
            {game.status === 'won' ? 'SECTOR CLEARED' : 'DETONATION'}
          </p>
          <button
            onClick={() => resetGame(difficulty)}
            className="
              mt-3 px-6 py-2 rounded font-mono text-sm font-semibold uppercase tracking-wider
              bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40
              hover:bg-accent-cyan/20 transition-all shadow-glow
            "
          >
            New Mission
          </button>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="font-mono text-[10px] text-gray-600 tracking-widest">
        LEFT-CLICK REVEAL &nbsp;·&nbsp; RIGHT-CLICK FLAG &nbsp;·&nbsp; CLICK NUMBER TO CHORD
      </footer>
    </div>
  );
}
