export type Locale = 'pt-BR' | 'en-US';

export interface TranslationKey {
  [key: string]: string | TranslationKey;
}

export interface Translations {
  [locale: string]: TranslationKey;
}

export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  fallbackLocale: Locale;
}

