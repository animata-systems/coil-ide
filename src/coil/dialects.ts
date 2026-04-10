import type { DialectTable } from 'coil-runtime/browser';

import deStandard from 'coil/dialects/de-standard/de-standard.json';
import enStandard from 'coil/dialects/en-standard/en-standard.json';
import esStandard from 'coil/dialects/es-standard/es-standard.json';
import frStandard from 'coil/dialects/fr-standard/fr-standard.json';
import jaStandard from 'coil/dialects/ja-standard/ja-standard.json';
import ptBrStandard from 'coil/dialects/pt-br-standard/pt-br-standard.json';
import ruStandard from 'coil/dialects/ru-standard/ru-standard.json';
import zhStandard from 'coil/dialects/zh-standard/zh-standard.json';

export type { DialectTable };

const ALL_DIALECTS: DialectTable[] = [
  deStandard as DialectTable,
  enStandard as DialectTable,
  esStandard as DialectTable,
  frStandard as DialectTable,
  jaStandard as DialectTable,
  ptBrStandard as DialectTable,
  ruStandard as DialectTable,
  zhStandard as DialectTable,
];

export const dialectRegistry = new Map<string, DialectTable>(
  ALL_DIALECTS.map(d => [d.name, d]),
);

export const DEFAULT_DIALECT = 'en-standard';
