import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getI18n } from '../i18n';
import type { Locale } from '../types';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  hasKey: (key: string) => boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

/**
 * Provider de i18n para React
 */
export function I18nProvider({ children, defaultLocale }: I18nProviderProps) {
  const i18n = getI18n();
  const [locale, setLocaleState] = useState<Locale>(i18n.getLocale());

  useEffect(() => {
    if (defaultLocale) {
      i18n.setLocale(defaultLocale);
      setLocaleState(defaultLocale);
    }

    // Listener para mudanças de locale
    const handleLocaleChange = () => {
      setLocaleState(i18n.getLocale());
    };

    window.addEventListener('i18n:locale-changed', handleLocaleChange);

    return () => {
      window.removeEventListener('i18n:locale-changed', handleLocaleChange);
    };
  }, [defaultLocale]);

  const setLocale = (newLocale: Locale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    hasKey: (key: string) => i18n.hasKey(key),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook para usar o contexto de i18n
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n deve ser usado dentro de I18nProvider');
  }
  return context;
}

