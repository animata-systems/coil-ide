// Headless entry point — no React, no Monaco.
//
// Suitable for Node-side or vanilla consumers that only need to parse,
// validate, and project COIL source to the COIL-H row model.

export { dialectRegistry, DEFAULT_DIALECT } from './coil/dialects';
export { astToCoilH } from './coil/coil-h';
export type { CoilHRow } from './coil/coil-h';

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
