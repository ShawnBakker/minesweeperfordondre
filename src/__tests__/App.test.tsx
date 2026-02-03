import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App — rendering', () => {
  it('renders the title', () => {
    render(<App />);
    expect(screen.getByText('MINESWEEPER')).toBeInTheDocument();
  });

  it('renders three difficulty buttons', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: /beginner/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /intermediate/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /expert/i })).toBeInTheDocument();
  });

  it('renders the board with the correct number of cells for beginner', () => {
    render(<App />);
    const board = screen.getByTestId('board');
    // 9 × 9 = 81 buttons
    const cells = board.querySelectorAll('button');
    expect(cells).toHaveLength(81);
  });

  it('renders a reset button', () => {
    render(<App />);
    expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
  });
});

describe('App — difficulty switching', () => {
  it('switches to intermediate (16×16 = 256 cells)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /intermediate/i }));
    const board = screen.getByTestId('board');
    const cells = board.querySelectorAll('button');
    expect(cells).toHaveLength(256);
  });

  it('switches to expert (16×30 = 480 cells)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /expert/i }));
    const board = screen.getByTestId('board');
    const cells = board.querySelectorAll('button');
    expect(cells).toHaveLength(480);
  });

  it('switches back to beginner', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /expert/i }));
    fireEvent.click(screen.getByRole('tab', { name: /beginner/i }));
    const board = screen.getByTestId('board');
    const cells = board.querySelectorAll('button');
    expect(cells).toHaveLength(81);
  });
});

describe('App — interactions', () => {
  it('reveals a cell on left click', () => {
    render(<App />);
    const cell = screen.getByTestId('cell-4-4');
    fireEvent.click(cell);
    // After clicking, the cell should now have aria-label with "adjacent mines"
    expect(cell.getAttribute('aria-label')).toMatch(/adjacent mines/);
  });

  it('places a flag on right click', () => {
    render(<App />);
    const cell = screen.getByTestId('cell-0-0');
    fireEvent.contextMenu(cell);
    expect(cell.getAttribute('aria-label')).toBe('flagged');
  });

  it('removes a flag on second right click', () => {
    render(<App />);
    const cell = screen.getByTestId('cell-0-0');
    fireEvent.contextMenu(cell);
    expect(cell.getAttribute('aria-label')).toBe('flagged');
    fireEvent.contextMenu(cell);
    expect(cell.getAttribute('aria-label')).toBe('hidden');
  });

  it('resets the game when the reset button is clicked', () => {
    render(<App />);
    // Make a move first
    fireEvent.click(screen.getByTestId('cell-4-4'));
    // Reset
    fireEvent.click(screen.getByTestId('reset-btn'));
    // All cells should be back to hidden
    const cell = screen.getByTestId('cell-4-4');
    expect(cell.getAttribute('aria-label')).toBe('hidden');
  });
});
