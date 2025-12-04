import type { Locale, TranslationKey, Translations, I18nConfig } from './types';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

const translations: Translations = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

const defaultConfig: I18nConfig = {
  defaultLocale: 'pt-BR',
  supportedLocales: ['pt-BR', 'en-US'],
  fallbackLocale: 'pt-BR',
};

class I18n {
  private locale: Locale;
  private config: I18nConfig;
  private translations: Translations;

  constructor(config?: Partial<I18nConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.translations = translations;
    
    // Detectar locale do navegador ou usar padrão
    this.locale = this.detectLocale();
  }

  /**
   * Detecta locale do navegador
   */
  private detectLocale(): Locale {
    if (typeof window === 'undefined') {
      return this.config.defaultLocale;
    }

    // Tentar obter do localStorage
    const stored = localStorage.getItem('@pei/i18n/locale');
    if (stored && this.config.supportedLocales.includes(stored as Locale)) {
      return stored as Locale;
    }

    // Tentar detectar do navegador
    const browserLocale = navigator.language || (navigator as any).userLanguage;
    if (browserLocale) {
      // Verificar se há suporte exato
      if (this.config.supportedLocales.includes(browserLocale as Locale)) {
        return browserLocale as Locale;
      }

      // Verificar se há suporte para idioma base (ex: pt-BR para pt)
      const baseLang = browserLocale.split('-')[0];
      const supported = this.config.supportedLocales.find(
        (loc) => loc.startsWith(baseLang)
      );
      if (supported) {
        return supported;
      }
    }

    return this.config.defaultLocale;
  }

  /**
   * Define o locale atual
   */
  setLocale(locale: Locale): void {
    if (!this.config.supportedLocales.includes(locale)) {
      console.warn(`Locale ${locale} não é suportado. Usando fallback.`);
      locale = this.config.fallbackLocale;
    }

    this.locale = locale;

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('@pei/i18n/locale', locale);
    }
  }

  /**
   * Obtém o locale atual
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * Traduz uma chave
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key);

    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Substituir parâmetros
    if (params) {
      return this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Obtém tradução de uma chave
   */
  private getTranslation(key: string): string | null {
    const keys = key.split('.');
    let current: TranslationKey | string = this.translations[this.locale];

    // Tentar locale atual
    for (const k of keys) {
      if (typeof current === 'object' && current[k]) {
        current = current[k];
      } else {
        // Fallback para locale padrão
        current = this.translations[this.config.fallbackLocale];
        for (const k2 of keys) {
          if (typeof current === 'object' && current[k2]) {
            current = current[k2];
          } else {
            return null;
          }
        }
        break;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    return null;
  }

  /**
   * Substitui parâmetros em uma string
   */
  private replaceParams(
    str: string,
    params: Record<string, string | number>
  ): string {
    let result = str;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Verifica se uma chave existe
   */
  hasKey(key: string): boolean {
    return this.getTranslation(key) !== null;
  }

  /**
   * Obtém todas as traduções do locale atual
   */
  getAllTranslations(): TranslationKey {
    return this.translations[this.locale];
  }
}

// Instância singleton
let i18nInstance: I18n | null = null;

/**
 * Obtém instância singleton do I18n
 */
export function getI18n(config?: Partial<I18nConfig>): I18n {
  if (!i18nInstance) {
    i18nInstance = new I18n(config);
  }
  return i18nInstance;
}

/**
 * Cria uma nova instância do I18n
 */
export function createI18n(config?: Partial<I18nConfig>): I18n {
  return new I18n(config);
}

// Exportar instância padrão
export const i18n = getI18n();

