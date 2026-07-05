/** Segundos → "45s" | "2 min" | "3d 4h" — usado en el temporizador de turno y en los presets del formulario de creación. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(totalSeconds / 3600);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(totalSeconds / 86400);
  const remainingHours = Math.floor((totalSeconds % 86400) / 3600);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}
