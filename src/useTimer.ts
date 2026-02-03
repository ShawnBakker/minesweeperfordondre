import { useState, useEffect, useRef } from 'react';
import type { GameStatus } from './engine';

/**
 * A simple elapsed-seconds timer driven by the game status.
 *
 *  idle    → reset to 0, stopped
 *  playing → counting
 *  won/lost → frozen at final value
 */
export function useTimer(status: GameStatus): number {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clean up any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status === 'idle') {
      setSeconds(0);
      return;
    }

    if (status === 'playing') {
      intervalRef.current = setInterval(() => {
        setSeconds(s => Math.min(s + 1, 999));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  return seconds;
}
