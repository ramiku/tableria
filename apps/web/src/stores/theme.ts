import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'tableria-theme' },
  ),
);

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

// Aplica el tema guardado antes del primer render (evita parpadeo) y en
// cada cambio posterior (toggle).
applyTheme(useThemeStore.getState().theme);
useThemeStore.subscribe((state) => applyTheme(state.theme));
