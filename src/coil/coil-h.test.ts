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
