import type { DialectTable } from 'coil-runtime/browser';

import enStandard from 'coil/dialects/en-standard/en-standard.json';
import enProfanity from 'coil/dialects/en-profanity/en-profanity.json';
import ruStandard from 'coil/dialects/ru-standard/ru-standard.json';
import ruMatrix from 'coil/dialects/ru-matrix/ru-matrix.json';
import ruMat from 'coil/dialects/ru-mat/ru-mat.json';

export type { DialectTable };

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
