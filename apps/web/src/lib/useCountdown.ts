import { useEffect, useState } from 'react';

/** Segundos restantes hasta `target` (ISO datetime), recalculado en cliente cada 250ms. */
export function useCountdownSeconds(target: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  return Math.max(0, Math.ceil((new Date(target).getTime() - now) / 1000));
}
