import type { Monaco } from '@monaco-editor/react';
import { dialectRegistry } from './dialects';
import { createCoilMonacoTokensProvider } from './monaco-tokens-provider';
import {
  COIL_LIGHT_THEME, COIL_DARK_THEME,
  coilLightTheme, coilDarkTheme,
} from './themes';

const registeredLanguages = new Set<string>();
let themesRegistered = false;

export function languageId(dialectName: string): string {
  return `coil-${dialectName}`;
}

/**
 * Register COIL themes with Monaco (idempotent).
 */
export function ensureThemes(monaco: Monaco): void {
  if (themesRegistered) return;
  monaco.editor.defineTheme(COIL_LIGHT_THEME, coilLightTheme);
  monaco.editor.defineTheme(COIL_DARK_THEME, coilDarkTheme);
  themesRegistered = true;
}

/**
 * Register a COIL language for the given dialect (lazy, cached).
 * Returns the language ID.
 *
 * Highlighting is driven by the runtime tokenizer (I-0015) via a
 * programmatic `setTokensProvider`. The previous Monarch grammar has
 * been removed — there is now a single source of truth (the lexer).
 */
export function ensureLanguage(dialectName: string, monaco: Monaco): string {
  const id = languageId(dialectName);
  if (registeredLanguages.has(id)) return id;

  const dialect = dialectRegistry.get(dialectName);
  if (!dialect) throw new Error(`Unknown dialect: ${dialectName}`);

  monaco.languages.register({ id });
  monaco.languages.setTokensProvider(id, createCoilMonacoTokensProvider(dialect, id, monaco));
  registeredLanguages.add(id);
  return id;
}

/**
 * Get the COIL theme name for the given resolved theme.
 */
export function coilThemeName(resolvedTheme: 'light' | 'dark'): string {
  return resolvedTheme === 'light' ? COIL_LIGHT_THEME : COIL_DARK_THEME;
}
