import enStandard from '../../../coil/dialects/en-standard/en-standard.json';
import enProfanity from '../../../coil/dialects/en-profanity/en-profanity.json';
import ruStandard from '../../../coil/dialects/ru-standard/ru-standard.json';
import ruMatrix from '../../../coil/dialects/ru-matrix/ru-matrix.json';
import ruMat from '../../../coil/dialects/ru-mat/ru-mat.json';

// TODO: Phase 4 — replace with import from coil-runtime/browser
export interface DialectTable {
  name: string;
  label: string;
  operators: Record<string, string>;
  terminators: Record<string, string>;
  modifiers: Record<string, string>;
  policies: Record<string, string>;
  resultTypes: Record<string, string>;
  durationSuffixes: Record<string, string>;
}

const ALL_DIALECTS: DialectTable[] = [
  enStandard as DialectTable,
  enProfanity as DialectTable,
  ruStandard as DialectTable,
  ruMatrix as DialectTable,
  ruMat as DialectTable,
];

export const dialectRegistry = new Map<string, DialectTable>(
  ALL_DIALECTS.map(d => [d.name, d]),
);

export const DEFAULT_DIALECT = 'en-standard';
