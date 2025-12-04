import { useMemo, useCallback } from 'react';
import { getI18n } from '../i18n';
import type { Locale } from '../types';

/**
 * Hook para usar traduções em componentes React
 */
export function useTranslation() {
  const i18n = getI18n();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return i18n.t(key, params);
    },
    []
  );

  const locale = useMemo(() => i18n.getLocale(), []);
  const setLocale = useCallback(
    (newLocale: Locale) => {
      i18n.setLocale(newLocale);
      // Forçar re-render (em produção, usar Context API)
      window.dispatchEvent(new Event('i18n:locale-changed'));
    },
    []
  );

  return {
    t,
    locale,
    setLocale,
    hasKey: useCallback((key: string) => i18n.hasKey(key), []),
  };
}

/**
 * Hook para obter apenas a função de tradução
 */
export function useT() {
  const { t } = useTranslation();
  return t;
}

