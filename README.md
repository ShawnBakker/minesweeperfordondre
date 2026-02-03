# 💣 Minesweeper // Dark Terminal

[![CI](https://github.com/YOUR_USERNAME/minesweeper-dark/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/minesweeper-dark/actions/workflows/ci.yml)

A dark-themed Minesweeper with a terminal/CRT aesthetic. Built with React 18, TypeScript, Tailwind CSS, and Vite.

**🕹️ [Play it live →](https://YOUR_USERNAME.github.io/minesweeper-dark/)**

## Features

- **Three difficulties** — Beginner (9×9), Intermediate (16×16), Expert (16×30)
- **First-click safety** — mines are placed *after* your first click, guaranteeing a cascade
- **Chord reveal** — click a revealed number with the correct flags to bulk-reveal neighbours
- **Flag toggling** — right-click to place/remove flags
- **Timer & mine counter** — track your speed and remaining mines
- **Dark terminal aesthetic** — CRT scanlines, grid background, glowing accents
- **Fully tested** — game engine unit tests + React component tests
- **CI/CD** — GitHub Actions pipeline: typecheck → test → build

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/minesweeper-dark.git
cd minesweeper-dark

# Install (requires Node 20+ and pnpm)
pnpm install

# Dev server (http://localhost:5173)
pnpm dev

# Run tests
pnpm test

# Production build
pnpm build
pnpm preview
```

## Project Structure

```
minesweeper-dark/
├── .github/workflows/
│   └── ci.yml              # GitHub Actions: lint, typecheck, test, build
├── public/
│   └── mine.svg            # Favicon
├── src/
│   ├── __tests__/
│   │   ├── engine.test.ts  # 20+ unit tests for game logic
│   │   └── App.test.tsx    # React component tests
│   ├── engine.ts           # Pure game logic (no React/DOM)
│   ├── useTimer.ts         # Timer hook
│   ├── App.tsx             # Main UI component
│   ├── main.tsx            # Entry point
│   ├── index.css           # Tailwind + custom styles
│   └── test-setup.ts       # Vitest setup
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Architecture

The game logic is separated from the UI:

- **`engine.ts`** — Pure functions: `createGame()`, `revealCell()`, `toggleFlag()`, `chordReveal()`. No side effects, no DOM. Every function takes a `GameState` and returns a new `GameState` (immutable). This makes it trivially testable.

- **`App.tsx`** — React UI that calls engine functions via `useState` + `useCallback`. The board is rendered as a CSS Grid of buttons.

- **`useTimer.ts`** — A small hook that starts/stops/resets based on the game status.

## Controls

| Action | Input |
|--------|-------|
| Reveal cell | Left click |
| Place/remove flag | Right click |
| Chord reveal | Left click on a revealed number (when correct flags surround it) |
| New game | Click face emoji or difficulty tab |

## Tech Stack

- **React 18** — UI
- **TypeScript** — strict mode
- **Tailwind CSS** — styling
- **Vite** — dev server & bundler
- **Vitest** — testing
- **Testing Library** — React component tests
- **GitHub Actions** — CI/CD + GitHub Pages deploy

## Hosting on GitHub Pages

The CI workflow automatically deploys to GitHub Pages on every push to `main`, but you need to flip one setting first:

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the workflow will typecheck → test → build → deploy
4. Your site will be live at `https://YOUR_USERNAME.github.io/minesweeper-dark/`

That's it. The workflow handles everything else automatically:
- It reads the repo name at build time to set Vite's `base` path, so asset URLs resolve correctly under the `/minesweeper-dark/` subpath.
- The deploy job only runs on `main` (not on PRs), and only after all CI checks pass.
- The `concurrency` setting ensures deployments don't race each other.

## License

MIT
