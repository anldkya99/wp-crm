import {
  platformDefaultLocale,
  platformFallbackLocale,
  supportedLocales,
  translationDictionaries,
  type PlatformLocale,
  type TranslationDictionary
} from "@/lib/platform/localization/locales";

export {
  platformDefaultLocale,
  platformFallbackLocale,
  platformLocaleCookieName,
  platformLocaleStorageKey,
  supportedLocales,
  type PlatformLocale
} from "@/lib/platform/localization/locales";

export type TranslationParams = Record<string, string | number>;
export type PlatformTranslator = (key: string, params?: TranslationParams) => string;

export function isSupportedLocale(value: unknown): value is PlatformLocale {
  return typeof value === "string" && supportedLocales.some((locale) => locale.code === value);
}

export function resolvePlatformLocale(value: unknown): PlatformLocale {
  return isSupportedLocale(value) ? value : platformDefaultLocale;
}

export function createTranslator(locale: PlatformLocale): PlatformTranslator {
  return (key, params) => translate(key, locale, params);
}

export function translate(key: string, locale: PlatformLocale = platformDefaultLocale, params: TranslationParams = {}) {
  const dictionary = translationDictionaries[locale] as TranslationDictionary | undefined;
  const fallback = translationDictionaries[platformFallbackLocale];
  const template = dictionary?.[key] ?? fallback[key] ?? developmentMissingTranslation(key);
  return interpolate(template, params);
}

function interpolate(template: string, params: TranslationParams) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? ""));
}

function developmentMissingTranslation(key: string) {
  if (process.env.NODE_ENV !== "production") return `[missing:${key}]`;
  return translationDictionaries[platformFallbackLocale]["language.missing"];
}
