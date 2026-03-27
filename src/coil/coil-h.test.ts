import { describe, it, expect } from 'vitest';
import {
  tokenize,
  parse,
  KeywordIndex,
  type DialectTable,
  type ScriptNode,
} from 'coil-runtime/browser';
import { astToCoilH, bodyValueToText } from './coil-h';
import enStandard from 'coil/dialects/en-standard/en-standard.json';
import ruStandard from 'coil/dialects/ru-standard/ru-standard.json';

const en = enStandard as DialectTable;
const ru = ruStandard as DialectTable;

function parseCoil(source: string, dialect: DialectTable): ScriptNode {
  const index = KeywordIndex.build(dialect);
  const tokens = tokenize(source, index);
  return parse(tokens, dialect, source);
}

function rows(source: string, dialect: DialectTable = ru) {
  const ast = parseCoil(source, dialect);
  return astToCoilH(ast, source, dialect);
}

// ── bodyValueToText ────────────────────────────────────────

describe('bodyValueToText', () => {
  it('converts ValueRef', () => {
    expect(bodyValueToText({
      type: 'ref', name: 'x', path: [], span: { line: 1, col: 1, offset: 0, length: 2 },
    })).toBe('$x');
  });

  it('converts ValueRef with path', () => {
    expect(bodyValueToText({
      type: 'ref', name: 'x', path: ['y', 'z'], span: { line: 1, col: 1, offset: 0, length: 6 },
    })).toBe('$x.y.z');
  });

  it('converts StringLiteral', () => {
    expect(bodyValueToText({
      type: 'string', value: 'hello', span: { line: 1, col: 1, offset: 0, length: 7 },
    })).toBe('hello');
  });

  it('converts NumberLiteral', () => {
    expect(bodyValueToText({
      type: 'number', value: 42, span: { line: 1, col: 1, offset: 0, length: 2 },
    })).toBe('42');
  });

  it('converts TemplateNode', () => {
    expect(bodyValueToText({
      type: 'template',
      parts: [
        { type: 'text', value: 'Hello, ', span: { line: 1, col: 1, offset: 0, length: 7 } },
        { type: 'ref', name: 'name', path: [], span: { line: 1, col: 8, offset: 7, length: 5 } },
      ],
      span: { line: 1, col: 1, offset: 0, length: 12 },
    })).toBe('<< Hello, $name >>');
  });
});

// ── Op.Actors ──────────────────────────────────────────────

describe('Op.Actors', () => {
  it('maps inline ACTORS to full-mode row', () => {
    const r = rows('ACTORS alice, bob', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Actors');
    expect(r[0].body).toBe('alice, bob');
    expect(r[0].name).toBe('');
    expect(r[0].mode).toBe('full');
    expect(r[0].step).toBe(1);
  });

  it('maps block УЧАСТНИКИ to full-mode row (ru)', () => {
    const src = 'УЧАСТНИКИ\n  алиса\n  боб\nКОНЕЦ';
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Actors');
    expect(r[0].body).toBe('алиса, боб');
    expect(r[0].mode).toBe('full');
  });
});

// ── Op.Tools ───────────────────────────────────────────────

describe('Op.Tools', () => {
  it('maps inline TOOLS to full-mode row', () => {
    const r = rows('TOOLS search, calc', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Tools');
    expect(r[0].body).toBe('search, calc');
    expect(r[0].name).toBe('');
    expect(r[0].mode).toBe('full');
  });
});

// ── Op.Define ──────────────────────────────────────────────

describe('Op.Define', () => {
  it('maps DEFINE with number literal', () => {
    const r = rows('DEFINE counter\n0\nEND', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Define');
    expect(r[0].body).toBe('0');
    expect(r[0].name).toBe('$counter');
    expect(r[0].mode).toBe('full');
  });

  it('maps DEFINE with ref value', () => {
    const r = rows('DEFINE alias\n$other.value\nEND', en);
    expect(r).toHaveLength(1);
    expect(r[0].body).toBe('$other.value');
    expect(r[0].name).toBe('$alias');
  });

  it('maps ОПРЕДЕЛИ with template (ru)', () => {
    const src = 'ОПРЕДЕЛИ msg\n<< Привет, $name! >>\nКОНЕЦ';
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Define');
    expect(r[0].body).toBe('<< Привет, $name! >>');
    expect(r[0].name).toBe('$msg');
    expect(r[0].templates).toEqual(['Привет, $name!']);
  });
});

// ── Op.Set ─────────────────────────────────────────────────

describe('Op.Set', () => {
  it('maps SET with string literal', () => {
    const r = rows('SET $config.mode\n"dark"\nEND', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Set');
    expect(r[0].body).toBe('dark');
    expect(r[0].name).toBe('$config.mode');
    expect(r[0].mode).toBe('full');
  });

  it('maps SET with number literal', () => {
    const r = rows('SET $counter\n3\nEND', en);
    expect(r).toHaveLength(1);
    expect(r[0].body).toBe('3');
  });
});

// ── Op.Think ──────────────────────────────────────────────

describe('Op.Think', () => {
  it('maps minimal THINK (name only, no modifiers)', () => {
    const src = [
      'THINK step',
      '  GOAL <<',
      '  Classify this.',
      '  >>',
      '  RESULT',
      '  * answer: TEXT - the answer',
      'END',
    ].join('\n');
    const r = rows(src, en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Think');
    expect(r[0].name).toBe('$step');
    expect(r[0].mode).toBe('full');
    expect(r[0].body).toContain('GOAL');
    expect(r[0].body).toContain('RESULT');
    expect(r[0].body).toContain('* answer: TEXT');
  });

  it('maps ДУМАЙ with full modifiers (КАК, ЦЕЛЬ, ВХОД, РЕЗУЛЬТАТ)', () => {
    const src = [
      'ДУМАЙ review',
      '  КАК $role',
      '  ЦЕЛЬ <<',
      '  Проверьте код.',
      '  >>',
      '  ВХОД <<',
      '  $message',
      '  >>',
      '  РЕЗУЛЬТАТ',
      '  * issues: ТЕКСТ - найденные проблемы',
      '  * score: ЧИСЛО - оценка от 1 до 10',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    const row = r[0];
    expect(row.operatorId).toBe('Op.Think');
    expect(row.name).toBe('$review');
    expect(row.mode).toBe('full');
    // Check modifier order per I-0003: оснащение → постановка → РЕЗУЛЬТАТ
    const lines = row.body.split('\n');
    const asIdx = lines.findIndex(l => l.startsWith('КАК'));
    const goalIdx = lines.findIndex(l => l.startsWith('ЦЕЛЬ'));
    const inputIdx = lines.findIndex(l => l.startsWith('ВХОД'));
    const resultIdx = lines.findIndex(l => l.startsWith('РЕЗУЛЬТАТ'));
    expect(asIdx).toBeLessThan(goalIdx);
    expect(goalIdx).toBeLessThan(inputIdx);
    expect(inputIdx).toBeLessThan(resultIdx);
    // Check templates collected
    expect(row.templates).toContain('Проверьте код.');
    expect(row.templates).toContain('$message');
  });

  it('maps ДУМАЙ with КОНТЕКСТ and anonymous body (D-0032)', () => {
    const src = [
      'ДУМАЙ analysis',
      '  ЦЕЛЬ <<',
      '  Analyse.',
      '  >>',
      '  КОНТЕКСТ <<',
      '  Background info.',
      '  >>',
      '  РЕЗУЛЬТАТ',
      '  * summary: ТЕКСТ - итог',
      '  <<',
      '  Additional instructions here.',
      '  >>',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    const body = r[0].body;
    expect(body).toContain('КОНТЕКСТ');
    expect(body).toContain('РЕЗУЛЬТАТ');
    expect(body).toContain('<< Additional instructions here. >>');
    // Body template should be in templates
    expect(r[0].templates).toContain('Additional instructions here.');
  });

  it('maps RESULT with nested LIST fields (depth indentation)', () => {
    const src = [
      'THINK step',
      '  RESULT',
      '  * summary: TEXT - brief',
      '  * items: LIST - found items',
      '    * name: TEXT - item name',
      '    * score: NUMBER - relevance',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const body = r[0].body;
    expect(body).toContain('RESULT');
    expect(body).toContain('* summary: TEXT — brief');
    expect(body).toContain('* items: LIST — found items');
    expect(body).toContain('  * name: TEXT — item name');
    expect(body).toContain('  * score: NUMBER — relevance');
  });

  it('maps RESULT with CHOICE type args', () => {
    const src = [
      'THINK classify',
      '  RESULT',
      '  * type: CHOICE(general, refund, technical) - request type',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const body = r[0].body;
    expect(body).toContain('CHOICE(general, refund, technical)');
  });

  it('maps ДУМАЙ with ЧЕРЕЗ and ИСПОЛЬЗУЯ', () => {
    const src = [
      'ДУМАЙ step',
      '  ЧЕРЕЗ $agent',
      '  ИСПОЛЬЗУЯ !search, !calc',
      '  ЦЕЛЬ <<',
      '  Find answer.',
      '  >>',
      '  РЕЗУЛЬТАТ',
      '  * answer: ТЕКСТ - ответ',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    const body = r[0].body;
    const lines = body.split('\n');
    expect(lines[0]).toBe('ЧЕРЕЗ $agent');
    expect(lines[1]).toBe('ИСПОЛЬЗУЯ !search, !calc');
  });
});

// ── Op.Execute ────────────────────────────────────────────

describe('Op.Execute', () => {
  it('maps EXECUTE with tool and args', () => {
    const src = [
      'EXECUTE result',
      '  USING !search',
      '  - query: "test query"',
      '  - limit: 10',
      'END',
    ].join('\n');
    const r = rows(src, en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Execute');
    expect(r[0].name).toBe('$result');
    expect(r[0].mode).toBe('full');
    expect(r[0].body).toContain('USING !search');
    expect(r[0].body).toContain('- query: test query');
    expect(r[0].body).toContain('- limit: 10');
  });

  it('maps ВЫПОЛНИ with ref arg value', () => {
    const src = [
      'ВЫПОЛНИ result',
      '  ИСПОЛЬЗУЯ !api',
      '  - data: $input.value',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    expect(r[0].body).toContain('ИСПОЛЬЗУЯ !api');
    expect(r[0].body).toContain('- data: $input.value');
  });
});

// ── Op.Wait ───────────────────────────────────────────────

describe('Op.Wait', () => {
  it('maps WAIT with single promise', () => {
    const src = [
      'WAIT',
      '  ON ?step1',
      'END',
    ].join('\n');
    const r = rows(src, en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Wait');
    expect(r[0].name).toBe('');
    expect(r[0].mode).toBe('full');
    expect(r[0].body).toBe('ON ?step1');
  });

  it('maps ЖДИ with multiple promises and mode ALL', () => {
    const src = [
      'ЖДИ',
      '  НА ?review1, ?review2, ?review3',
      '  РЕЖИМ ВСЕ',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    const body = r[0].body;
    expect(body).toContain('НА ?review1, ?review2, ?review3');
    expect(body).toContain('РЕЖИМ ВСЕ');
  });

  it('maps WAIT with timeout', () => {
    const src = [
      'WAIT',
      '  ON ?task',
      '  TIMEOUT 30s',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const body = r[0].body;
    expect(body).toContain('ON ?task');
    expect(body).toContain('TIMEOUT 30');
  });
});

// ── Op.Signal ─────────────────────────────────────────────

describe('Op.Signal', () => {
  it('maps SIGNAL with template body', () => {
    const src = [
      'SIGNAL ~updates',
      '<<',
      'New data available: $result.summary',
      '>>',
      'END',
    ].join('\n');
    const r = rows(src, en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Signal');
    expect(r[0].name).toBe('~updates');
    expect(r[0].mode).toBe('full');
    expect(r[0].body).toContain('New data available: $result.summary');
    expect(r[0].templates).toContain('New data available: $result.summary');
  });
});

// ── Mixed scenario ─────────────────────────────────────────

describe('mixed operators', () => {
  it('numbers steps correctly with comments as dividers', () => {
    const src = [
      "ACTORS user",
      "",
      "' Section",
      "RECEIVE name",
      "<<",
      "What is your name?",
      ">>",
      "END",
      "",
      "EXIT",
    ].join('\n');
    const r = rows(src, en);
    // ACTORS=1, divider, RECEIVE=2, EXIT=3
    expect(r).toHaveLength(4);
    expect(r[0].step).toBe(1);
    expect(r[0].operatorId).toBe('Op.Actors');
    expect(r[1].mode).toBe('divider');
    expect(r[2].step).toBe(2);
    expect(r[2].operatorId).toBe('Op.Receive');
    expect(r[3].step).toBe(3);
    expect(r[3].operatorId).toBe('Op.Exit');
  });
});

