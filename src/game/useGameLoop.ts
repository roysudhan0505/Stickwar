import { useEffect, useRef } from 'react';

interface GameLoopOptions {
  onTick: (dt: number, time: number) => void;
  isRunning?: boolean;
}

export function useGameLoop({ onTick, isRunning = true }: GameLoopOptions) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const onTickRef = useRef(onTick);

  // Keep latest onTick reference without re-triggering effect
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!isRunning) {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      previousTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        // Delta time in seconds, capped at 0.05 (20fps minimum) to prevent tunneling or physics explosion
        const rawDt = (time - previousTimeRef.current) / 1000;
        const dt = Math.min(rawDt, 0.05);
        onTickRef.current(dt, time);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isRunning]);
}
