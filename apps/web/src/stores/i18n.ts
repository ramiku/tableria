import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'tableria-locale' },
  ),
);

function applyLocale(locale: Locale) {
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
  // Sincroniza el título del documento con el idioma elegido.
  // Usar i18n.t aquí es seguro: la suscripción se dispara después del
  // changeLanguage, así que las claves ya están cargadas.
  document.title = i18n.t('app.documentTitle');
}

// Aplica el idioma guardado antes del primer render (evita parpadeo de textos)
// y en cada cambio posterior.
applyLocale(useLocaleStore.getState().locale);
useLocaleStore.subscribe((state) => applyLocale(state.locale));