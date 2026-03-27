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

function parseAndMap(source: string, dialect: DialectTable) {
  const index = KeywordIndex.build(dialect);
  const tokens = tokenize(source, index);
  const ast = parse(tokens, dialect, source);
  return astToCoilH(ast, source, dialect);
}

describe('Phase 1 examples — no degraded rows', () => {
  for (const { file, dialect: dialectName } of phase1Examples) {
    it(`${file} has no degraded rows`, () => {
      const source = readExample(file);
      const dialect = dialects[dialectName];
      const rows = parseAndMap(source, dialect);

      const degraded = rows.filter(r => r.mode === 'degraded');
      expect(degraded, `degraded rows: ${degraded.map(r => r.operatorId).join(', ')}`).toHaveLength(0);
    });
  }
});

/**
 * Phase 2 examples: contain THINK, EXECUTE, WAIT, SIGNAL operators.
 * Should have zero degraded rows.
 */
const phase2Examples = [
  { file: 'anti-patterns/everything-in-one-think.coil', dialect: 'en-standard' },
  { file: 'patterns/parallelization.coil', dialect: 'ru-standard' },
  { file: 'patterns/routing.coil', dialect: 'ru-standard' },
  { file: 'patterns/prompt-chaining.coil', dialect: 'ru-standard' },
  { file: 'patterns/evaluator-optimizer.coil', dialect: 'ru-standard' },
];

describe('Phase 2 examples — no degraded rows', () => {
  for (const { file, dialect: dialectName } of phase2Examples) {
    it(`${file} has no degraded rows`, () => {
      const source = readExample(file);
      const dialect = dialects[dialectName];
      const rows = parseAndMap(source, dialect);

      const degraded = rows.filter(r => r.mode === 'degraded');
      expect(degraded, `degraded rows: ${degraded.map(r => r.operatorId).join(', ')}`).toHaveLength(0);
    });
  }

  it('parallelization.coil — correct operator counts', () => {
    const source = readExample('patterns/parallelization.coil');
    const dialect = dialects['ru-standard'];
    const rows = parseAndMap(source, dialect);
    const ops = rows.filter(r => r.mode === 'full').map(r => r.operatorId);
    expect(ops.filter(o => o === 'Op.Think')).toHaveLength(4);
    expect(ops.filter(o => o === 'Op.Wait')).toHaveLength(2);
  });

  it('everything-in-one-think.coil — key operators present', () => {
    const source = readExample('anti-patterns/everything-in-one-think.coil');
    const dialect = dialects['en-standard'];
    const rows = parseAndMap(source, dialect);
    const ops = rows.filter(r => r.mode === 'full').map(r => r.operatorId);
    expect(ops).toContain('Op.Think');
    expect(ops).toContain('Op.Wait');
    expect(ops).toContain('Op.Send');
    expect(ops).toContain('Op.Exit');
  });
});
