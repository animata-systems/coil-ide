import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  tokenize,
  parse,
  KeywordIndex,
  type DialectTable,
} from 'coil-runtime/browser';
import { astToCoilH } from './coil-h';
import enStandard from 'coil/dialects/en-standard/en-standard.json';
import ruStandard from 'coil/dialects/ru-standard/ru-standard.json';
import ruMatrix from 'coil/dialects/ru-matrix/ru-matrix.json';

const dialects: Record<string, DialectTable> = {
  'en-standard': enStandard as DialectTable,
  'ru-standard': ruStandard as DialectTable,
  'ru-matrix': ruMatrix as DialectTable,
};

function examplePath(rel: string): string {
  return resolve(process.cwd(), 'node_modules/coil/examples', rel);
}

function readExample(rel: string): string {
  return readFileSync(examplePath(rel), 'utf-8');
}

/**
 * Phase 1 examples: only contain operators from Phase 1
 * (ACTORS, TOOLS, DEFINE, SET, RECEIVE, SEND, EXIT).
 * Should have zero degraded rows.
 */
const phase1Examples = [
  { file: 'hello.coil', dialect: 'en-standard' },
  { file: 'hello.ru.coil', dialect: 'ru-matrix' },
  { file: 'anti-patterns/define-instead-of-set.coil', dialect: 'en-standard' },
];

describe('Phase 1 examples — no degraded rows', () => {
  for (const { file, dialect: dialectName } of phase1Examples) {
    it(`${file} has no degraded rows`, () => {
      const source = readExample(file);
      const dialect = dialects[dialectName];
      const index = KeywordIndex.build(dialect);
      const tokens = tokenize(source, index);
      const ast = parse(tokens, dialect, source);
      const rows = astToCoilH(ast, source, dialect);

      const degraded = rows.filter(r => r.mode === 'degraded');
      expect(degraded, `degraded rows: ${degraded.map(r => r.operatorId).join(', ')}`).toHaveLength(0);
    });
  }
});
