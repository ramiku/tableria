import type { MatchRuntime } from './registry.js';

export function armTurnTimer(runtime: MatchRuntime, deadlineAt: Date, onTimeout: () => void): void {
  disarmTurnTimer(runtime);
  const delay = Math.max(0, deadlineAt.getTime() - Date.now());
  runtime.turnTimer = setTimeout(onTimeout, delay);
}

export function disarmTurnTimer(runtime: MatchRuntime): void {
  if (runtime.turnTimer) {
    clearTimeout(runtime.turnTimer);
    runtime.turnTimer = null;
  }
}

export function armReadyTimer(runtime: MatchRuntime, endsAt: Date, onElapsed: () => void): void {
  disarmReadyTimer(runtime);
  runtime.readyCheckEndsAt = endsAt;
  const delay = Math.max(0, endsAt.getTime() - Date.now());
  runtime.readyTimer = setTimeout(onElapsed, delay);
}

export function disarmReadyTimer(runtime: MatchRuntime): void {
  if (runtime.readyTimer) {
    clearTimeout(runtime.readyTimer);
    runtime.readyTimer = null;
  }
  runtime.readyCheckEndsAt = null;
}
