import en from './locales/en/common.json';
import si from './locales/si/common.json';

export type Language = 'en' | 'si';
export const LANGUAGE_STORAGE_KEY = 'nirvanaya-language';
export const isLanguage = (value: unknown): value is Language => value === 'en' || value === 'si';

export function lookup(source: unknown, key: string): string | undefined {
  let value = source;
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, part)) return;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function placeholders(value: string): string {
  return [...new Set(value.match(/\{\w+\}/g) || [])].sort().join(',');
}

export function translate(language: Language, key: string, params?: Record<string, string | number>, overrides: Record<string, string> = {}): string {
  const english = lookup(en, key);
  const override = overrides[key];
  const validOverride = english && override?.trim() && placeholders(english) === placeholders(override) ? override : undefined;
  const value = (language === 'si' ? validOverride || lookup(si, key) : english) || english || key;
  return value.replace(/\{(\w+)\}/g, (match, name: string) => params?.[name] !== undefined ? String(params[name]) : match);
}
