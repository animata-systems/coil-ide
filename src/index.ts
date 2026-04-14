// Public API of the coil-ide package.
//
// Two entry points:
//   - `coil-ide`          — full API (React components + headless pipeline)
//   - `coil-ide/headless` — headless pipeline only, no React
//
// Consumers outside playground (sandbox, future tools) import from here.

// ── React components ───────────────────────────────────────
export { PipelineProvider, usePipeline } from './components/PipelineProvider';
export type { PipelineProviderProps } from './components/PipelineProvider';
export { EditorView } from './components/EditorView';
export type { EditorViewProps } from './components/EditorView';
export { CoilHTable } from './components/CoilHTable';
export type { CoilHTableProps } from './components/CoilHTable';

// ── Monaco language support ────────────────────────────────
export {
  ensureThemes,
  ensureLanguage,
  coilThemeName,
  languageId,
} from './coil/languages';
export { spanToRange } from './coil/monaco-utils';
export { createCoilMonacoTokensProvider } from './coil/monaco-tokens-provider';
export {
  COIL_LIGHT_THEME,
  COIL_DARK_THEME,
  coilLightTheme,
  coilDarkTheme,
} from './coil/themes';

// ── Headless pipeline (also exported via ./headless) ───────
export { dialectRegistry, DEFAULT_DIALECT } from './coil/dialects';
export { astToCoilH } from './coil/coil-h';
export type {
  CoilHRow,
  CoilHCell,
  CoilHValue,
  ResultFieldRow,
} from './coil/coil-h';

// ── Runtime re-exports for consumer convenience ────────────
export {
  tokenize,
  parse,
  validate,
  KeywordIndex,
  LexerError,
  ParseError,
} from 'coil-runtime/browser';
export type {
  DialectTable,
  ScriptNode,
  Token,
  ValidationDiagnostic,
} from 'coil-runtime/browser';
