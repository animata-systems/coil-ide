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

const dialects: Record<string, DialectTable> = {
  'en-standard': enStandard as DialectTable,
  'ru-standard': ruStandard as DialectTable,
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
  { file: 'hello-world.coil', dialect: 'ru-standard' },
  { file: 'anti-patterns/define-instead-of-set.coil', dialect: 'ru-standard' },
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
  { file: 'anti-patterns/everything-in-one-think.coil', dialect: 'ru-standard' },
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
    const dialect = dialects['ru-standard'];
    const rows = parseAndMap(source, dialect);
    const ops = rows.filter(r => r.mode === 'full').map(r => r.operatorId);
    expect(ops).toContain('Op.Think');
    expect(ops).toContain('Op.Wait');
    expect(ops).toContain('Op.Send');
    expect(ops).toContain('Op.Exit');
  });

  it('routing.coil — IF operators have nested numbering', () => {
    const source = readExample('patterns/routing.coil');
    const dialect = dialects['ru-standard'];
    const rows = parseAndMap(source, dialect);
    const ifRows = rows.filter(r => r.operatorId === 'Op.If');
    expect(ifRows.length).toBeGreaterThan(0);
    // Nested DEFINE inside IF should have sub-numbering
    for (const ifRow of ifRows) {
      const ifStep = ifRow.step!;
      expect(ifStep).toHaveLength(1); // top-level
      // Find nested rows
      const nested = rows.filter(r =>
        r.step !== null && r.step.length === 2 && r.step[0] === ifStep[0],
      );
      expect(nested.length).toBeGreaterThan(0);
    }
  });

  it('evaluator-optimizer.coil — REPEAT operator has nested numbering', () => {
    const source = readExample('patterns/evaluator-optimizer.coil');
    const dialect = dialects['ru-standard'];
    const rows = parseAndMap(source, dialect);
    const repeatRows = rows.filter(r => r.operatorId === 'Op.Repeat');
    expect(repeatRows).toHaveLength(1);
    const repeatStep = repeatRows[0].step!;
    // Nested operators inside REPEAT
    const nested = rows.filter(r =>
      r.step !== null && r.step.length > 1 && r.step[0] === repeatStep[0],
    );
    expect(nested.length).toBeGreaterThan(0);
  });
});

/**
 * I-0005 invariant: physical template markers `<<`/`>>` must never
 * leak into structural template cells. The renderer owns those markers
 * visually — data carries trimmed plain text.
 */
describe('I-0005 invariant — no <<>> in template cells', () => {
  const allExamples = [...phase1Examples, ...phase2Examples];
  for (const { file, dialect: dialectName } of allExamples) {
    it(`${file} has no <<>> in any template cell or modifier[template] value`, () => {
      const source = readExample(file);
      const dialect = dialects[dialectName];
      const rows = parseAndMap(source, dialect);

      for (const row of rows) {
        for (const cell of row.cells) {
          if (cell.kind === 'template') {
            expect(cell.text, `${file} row step=${row.step?.join('.')}`).not.toContain('<<');
            expect(cell.text).not.toContain('>>');
          }
          if (cell.kind === 'modifier' && cell.value.kind === 'template') {
            expect(cell.value.text, `${file} row step=${row.step?.join('.')} mod=${cell.label}`).not.toContain('<<');
            expect(cell.value.text).not.toContain('>>');
          }
        }
      }
    });
  }
});
