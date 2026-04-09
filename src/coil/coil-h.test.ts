import { describe, it, expect } from 'vitest';
import {
  tokenize,
  parse,
  KeywordIndex,
  type DialectTable,
  type ScriptNode,
} from 'coil-runtime/browser';
import {
  astToCoilH,
  bodyValueToText,
  type CoilHCell,
  type CoilHRow,
} from './coil-h';
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

function findMod(row: CoilHRow, label: string): CoilHCell | undefined {
  return row.cells.find(c => c.kind === 'modifier' && c.label === label);
}

function modIndex(row: CoilHRow, label: string): number {
  return row.cells.findIndex(c => c.kind === 'modifier' && c.label === label);
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
});

// ── Op.Actors ──────────────────────────────────────────────

describe('Op.Actors', () => {
  it('maps inline ACTORS to full-mode row with text cell', () => {
    const r = rows('ACTORS alice, bob', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Actors');
    expect(r[0].cells).toEqual([{ kind: 'text', text: 'alice, bob' }]);
    expect(r[0].name).toBe('');
    expect(r[0].mode).toBe('full');
    expect(r[0].step).toEqual([1]);
  });

  it('maps block УЧАСТНИКИ to full-mode row (ru)', () => {
    const src = 'УЧАСТНИКИ\n  алиса\n  боб\nКОНЕЦ';
    const r = rows(src, ru);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Actors');
    expect(r[0].cells).toEqual([{ kind: 'text', text: 'алиса, боб' }]);
  });
});

// ── Op.Tools ───────────────────────────────────────────────

describe('Op.Tools', () => {
  it('maps inline TOOLS to text cell', () => {
    const r = rows('TOOLS search, calc', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Tools');
    expect(r[0].cells).toEqual([{ kind: 'text', text: 'search, calc' }]);
    expect(r[0].mode).toBe('full');
  });
});

// ── Op.Define ──────────────────────────────────────────────

describe('Op.Define', () => {
  it('maps DEFINE with number literal → text cell', () => {
    const r = rows('DEFINE counter\n0\nEND', en);
    expect(r).toHaveLength(1);
    expect(r[0].operatorId).toBe('Op.Define');
    expect(r[0].cells).toEqual([{ kind: 'text', text: '0' }]);
    expect(r[0].name).toBe('$counter');
  });

  it('maps DEFINE with ref value → text cell', () => {
    const r = rows('DEFINE alias\n$other.value\nEND', en);
    expect(r[0].cells).toEqual([{ kind: 'text', text: '$other.value' }]);
    expect(r[0].name).toBe('$alias');
  });

  it('maps ОПРЕДЕЛИ with template → template cell (no <<>>)', () => {
    const src = 'ОПРЕДЕЛИ msg\n<< Привет, $name! >>\nКОНЕЦ';
    const r = rows(src, ru);
    expect(r[0].operatorId).toBe('Op.Define');
    expect(r[0].cells).toEqual([{ kind: 'template', text: 'Привет, $name!' }]);
    expect(r[0].name).toBe('$msg');
    expect(r[0].templates).toEqual(['Привет, $name!']);
  });
});

// ── Op.Set ─────────────────────────────────────────────────

describe('Op.Set', () => {
  it('maps SET with string literal → text cell', () => {
    const r = rows('SET $config.mode\n"dark"\nEND', en);
    expect(r[0].operatorId).toBe('Op.Set');
    expect(r[0].cells).toEqual([{ kind: 'text', text: 'dark' }]);
    expect(r[0].name).toBe('$config.mode');
  });

  it('maps SET with number literal → text cell', () => {
    const r = rows('SET $counter\n3\nEND', en);
    expect(r[0].cells).toEqual([{ kind: 'text', text: '3' }]);
  });
});

// ── Op.Think ──────────────────────────────────────────────

describe('Op.Think', () => {
  it('maps minimal THINK (GOAL + RESULT)', () => {
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
    const row = r[0];
    expect(row.operatorId).toBe('Op.Think');
    expect(row.name).toBe('$step');

    // GOAL modifier with template value
    const goal = findMod(row, en.modifiers['Mod.Goal']);
    expect(goal).toBeDefined();
    expect(goal).toMatchObject({
      kind: 'modifier',
      value: { kind: 'template', text: 'Classify this.' },
    });

    // RESULT as structural result-block
    const resultCell = row.cells.find(c => c.kind === 'result-block');
    expect(resultCell).toBeDefined();
    expect(resultCell).toMatchObject({
      kind: 'result-block',
      label: en.modifiers['Mod.Result'],
    });
    if (resultCell?.kind === 'result-block') {
      expect(resultCell.fields).toEqual([
        { name: 'answer', type: 'TEXT', description: 'the answer', depth: 0 },
      ]);
    }
  });

  it('maps ДУМАЙ with full modifiers in I-0003 order', () => {
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
    const row = r[0];
    expect(row.operatorId).toBe('Op.Think');
    expect(row.name).toBe('$review');

    // Order: КАК → ЦЕЛЬ → ВХОД → РЕЗУЛЬТАТ
    const asIdx = modIndex(row, ru.modifiers['Mod.As']);
    const goalIdx = modIndex(row, ru.modifiers['Mod.Goal']);
    const inputIdx = modIndex(row, ru.modifiers['Mod.Input']);
    const resultIdx = row.cells.findIndex(c => c.kind === 'result-block');

    expect(asIdx).toBeGreaterThanOrEqual(0);
    expect(goalIdx).toBeGreaterThanOrEqual(0);
    expect(inputIdx).toBeGreaterThanOrEqual(0);
    expect(resultIdx).toBeGreaterThanOrEqual(0);
    expect(asIdx).toBeLessThan(goalIdx);
    expect(goalIdx).toBeLessThan(inputIdx);
    expect(inputIdx).toBeLessThan(resultIdx);

    // КАК — plain value (ref)
    const asCell = row.cells[asIdx];
    expect(asCell).toMatchObject({ kind: 'modifier', value: { kind: 'plain', text: '$role' } });

    // ЦЕЛЬ/ВХОД — template values
    expect(row.cells[goalIdx]).toMatchObject({
      kind: 'modifier',
      value: { kind: 'template', text: 'Проверьте код.' },
    });
    expect(row.cells[inputIdx]).toMatchObject({
      kind: 'modifier',
      value: { kind: 'template', text: '$message' },
    });

    // РЕЗУЛЬТАТ fields
    const resultCell = row.cells[resultIdx];
    if (resultCell.kind === 'result-block') {
      expect(resultCell.fields).toHaveLength(2);
      expect(resultCell.fields[0]).toEqual({
        name: 'issues',
        type: 'ТЕКСТ',
        description: 'найденные проблемы',
        depth: 0,
      });
      expect(resultCell.fields[1].name).toBe('score');
      expect(resultCell.fields[1].type).toBe('ЧИСЛО');
    }

    // Templates collected
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
    const row = r[0];

    // КОНТЕКСТ modifier present
    const ctx = findMod(row, ru.modifiers['Mod.Context']);
    expect(ctx).toMatchObject({
      kind: 'modifier',
      value: { kind: 'template', text: 'Background info.' },
    });

    // РЕЗУЛЬТАТ present
    expect(row.cells.some(c => c.kind === 'result-block')).toBe(true);

    // Anonymous body — trailing template cell
    const lastCell = row.cells[row.cells.length - 1];
    expect(lastCell).toEqual({ kind: 'template', text: 'Additional instructions here.' });

    // Template in templates list
    expect(row.templates).toContain('Additional instructions here.');
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
    const resultCell = r[0].cells.find(c => c.kind === 'result-block');
    expect(resultCell).toBeDefined();
    if (resultCell?.kind === 'result-block') {
      expect(resultCell.fields).toEqual([
        { name: 'summary', type: 'TEXT', description: 'brief', depth: 0 },
        { name: 'items', type: 'LIST', description: 'found items', depth: 0 },
        { name: 'name', type: 'TEXT', description: 'item name', depth: 1 },
        { name: 'score', type: 'NUMBER', description: 'relevance', depth: 1 },
      ]);
    }
  });

  it('maps RESULT with CHOICE type args', () => {
    const src = [
      'THINK classify',
      '  RESULT',
      '  * type: CHOICE(general, refund, technical) - request type',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const resultCell = r[0].cells.find(c => c.kind === 'result-block');
    if (resultCell?.kind === 'result-block') {
      expect(resultCell.fields[0].type).toBe('CHOICE(general, refund, technical)');
    }
  });

  it('maps ДУМАЙ with ЧЕРЕЗ and ИСПОЛЬЗУЯ (equipment comes first)', () => {
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
    const row = r[0];

    // First cell = ЧЕРЕЗ, second = ИСПОЛЬЗУЯ
    expect(row.cells[0]).toMatchObject({
      kind: 'modifier',
      label: ru.modifiers['Mod.Via'],
      value: { kind: 'plain', text: '$agent' },
    });
    expect(row.cells[1]).toMatchObject({
      kind: 'modifier',
      label: ru.modifiers['Mod.Using'],
      value: { kind: 'plain', text: '!search, !calc' },
    });
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
    const row = r[0];
    expect(row.operatorId).toBe('Op.Execute');
    expect(row.name).toBe('$result');

    // USING modifier
    expect(row.cells[0]).toMatchObject({
      kind: 'modifier',
      label: en.modifiers['Mod.Using'],
      value: { kind: 'plain', text: '!search' },
    });

    // args-block
    expect(row.cells[1]).toMatchObject({
      kind: 'args-block',
      args: [
        { key: 'query', value: 'test query' },
        { key: 'limit', value: '10' },
      ],
    });
  });

  it('maps ВЫПОЛНИ with ref arg value', () => {
    const src = [
      'ВЫПОЛНИ result',
      '  ИСПОЛЬЗУЯ !api',
      '  - data: $input.value',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    const row = r[0];
    expect(row.cells[0]).toMatchObject({
      kind: 'modifier',
      label: ru.modifiers['Mod.Using'],
      value: { kind: 'plain', text: '!api' },
    });
    expect(row.cells[1]).toMatchObject({
      kind: 'args-block',
      args: [{ key: 'data', value: '$input.value' }],
    });
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
    expect(r[0].operatorId).toBe('Op.Wait');
    expect(r[0].cells).toEqual([
      {
        kind: 'modifier',
        label: en.modifiers['Mod.On'],
        value: { kind: 'plain', text: '?step1' },
      },
    ]);
  });

  it('maps ЖДИ with multiple promises and mode ALL', () => {
    const src = [
      'ЖДИ',
      '  НА ?review1, ?review2, ?review3',
      '  РЕЖИМ ВСЕ',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    const row = r[0];

    const on = findMod(row, ru.modifiers['Mod.On']);
    expect(on).toMatchObject({
      value: { kind: 'plain', text: '?review1, ?review2, ?review3' },
    });

    const mode = findMod(row, ru.modifiers['Mod.Mode']);
    expect(mode).toMatchObject({
      value: { kind: 'plain', text: ru.policies['Pol.All'] },
    });
  });

  it('maps WAIT with timeout', () => {
    const src = [
      'WAIT',
      '  ON ?task',
      '  TIMEOUT 30s',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const row = r[0];
    const timeout = findMod(row, en.modifiers['Mod.Timeout']);
    expect(timeout).toBeDefined();
    if (timeout?.kind === 'modifier' && timeout.value.kind === 'plain') {
      expect(timeout.value.text).toContain('30');
    }
  });
});

// ── Op.Signal ─────────────────────────────────────────────

describe('Op.Signal', () => {
  it('maps SIGNAL with template body (no <<>>)', () => {
    const src = [
      'SIGNAL ~updates',
      '<<',
      'New data available: $result.summary',
      '>>',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const row = r[0];
    expect(row.operatorId).toBe('Op.Signal');
    expect(row.name).toBe('~updates');
    expect(row.cells).toEqual([
      { kind: 'template', text: 'New data available: $result.summary' },
    ]);
    expect(row.templates).toContain('New data available: $result.summary');
  });
});

// ── Op.Send ───────────────────────────────────────────────

describe('Op.Send', () => {
  it('maps SEND with channel, template body (no <<>>)', () => {
    const src = [
      'ACTORS user',
      '',
      'SEND',
      '  TO #main',
      '  FOR @user',
      '<<',
      'Hello, $name!',
      '>>',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const send = r.find(row => row.operatorId === 'Op.Send')!;

    expect(findMod(send, en.modifiers['Mod.To'])).toMatchObject({
      value: { kind: 'plain', text: '#main' },
    });
    expect(findMod(send, en.modifiers['Mod.For'])).toMatchObject({
      value: { kind: 'plain', text: '@user' },
    });

    // Template cell at the end
    const tpl = send.cells.find(c => c.kind === 'template');
    expect(tpl).toEqual({ kind: 'template', text: 'Hello, $name!' });
  });
});

// ── Op.If ─────────────────────────────────────────────────

describe('Op.If', () => {
  it('maps IF with nested operators and sub-numbering', () => {
    const src = [
      'ACTORS user',
      '',
      'IF $x == 1',
      '  EXIT',
      'END',
      '',
      'EXIT',
    ].join('\n');
    const r = rows(src, en);
    const full = r.filter(row => row.mode === 'full');
    expect(full[0].step).toEqual([1]);
    expect(full[0].operatorId).toBe('Op.Actors');
    expect(full[1].step).toEqual([2]);
    expect(full[1].operatorId).toBe('Op.If');
    expect(full[1].cells).toEqual([{ kind: 'text', text: '$x == 1' }]);
    expect(full[2].step).toEqual([2, 1]);
    expect(full[2].operatorId).toBe('Op.Exit');
    expect(full[3].step).toEqual([3]);
  });

  it('maps ЕСЛИ with multiple nested steps (ru)', () => {
    const src = [
      'ЕСЛИ $flag == 1',
      '  ОПРЕДЕЛИ msg',
      '  "hello"',
      '  КОНЕЦ',
      '  ВЫХОД',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    const full = r.filter(row => row.mode === 'full');
    expect(full[0].step).toEqual([1]);
    expect(full[0].operatorId).toBe('Op.If');
    expect(full[1].step).toEqual([1, 1]);
    expect(full[1].operatorId).toBe('Op.Define');
    expect(full[2].step).toEqual([1, 2]);
    expect(full[2].operatorId).toBe('Op.Exit');
  });

  it('maps double nesting (IF inside IF)', () => {
    const src = [
      'IF $a == 1',
      '  IF $b == 2',
      '    EXIT',
      '  END',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const full = r.filter(row => row.mode === 'full');
    expect(full[0].step).toEqual([1]);
    expect(full[1].step).toEqual([1, 1]);
    expect(full[2].step).toEqual([1, 1, 1]);
  });

  it('comment inside block does not affect numbering', () => {
    const src = [
      'IF $x == 1',
      "  ' note",
      '  EXIT',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const dividers = r.filter(row => row.mode === 'divider');
    expect(dividers).toHaveLength(1);
    const full = r.filter(row => row.mode === 'full');
    expect(full[1].step).toEqual([1, 1]);
  });
});

// ── Op.Repeat ─────────────────────────────────────────────

describe('Op.Repeat', () => {
  it('maps ПОВТОРЯЙ with until and limit', () => {
    const src = [
      'ПОВТОРЯЙ ДО $done НЕ БОЛЕЕ 3',
      '  ВЫХОД',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);
    const full = r.filter(row => row.mode === 'full');
    expect(full[0].operatorId).toBe('Op.Repeat');

    const until = findMod(full[0], ru.modifiers['Mod.Until']);
    expect(until).toMatchObject({ value: { kind: 'plain', text: '$done' } });

    const limit = findMod(full[0], ru.modifiers['Mod.Limit']);
    expect(limit).toMatchObject({ value: { kind: 'plain', text: '3' } });

    expect(full[1].step).toEqual([1, 1]);
    expect(full[1].operatorId).toBe('Op.Exit');
  });
});

// ── Op.Each ───────────────────────────────────────────────

describe('Op.Each', () => {
  it('maps EACH with element and from as text cell', () => {
    const src = [
      'EACH $item FROM $list',
      '  EXIT',
      'END',
    ].join('\n');
    const r = rows(src, en);
    const full = r.filter(row => row.mode === 'full');
    expect(full[0].operatorId).toBe('Op.Each');
    expect(full[0].cells).toEqual([
      { kind: 'text', text: '$item' },
      {
        kind: 'modifier',
        label: en.modifiers['Mod.From'],
        value: { kind: 'plain', text: '$list' },
      },
    ]);
    expect(full[1].step).toEqual([1, 1]);
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
    expect(r).toHaveLength(4);
    expect(r[0].step).toEqual([1]);
    expect(r[0].operatorId).toBe('Op.Actors');
    expect(r[1].mode).toBe('divider');
    expect(r[1].cells).toHaveLength(1);
    expect(r[1].cells[0].kind).toBe('text');
    expect(r[2].step).toEqual([2]);
    expect(r[2].operatorId).toBe('Op.Receive');
    expect(r[2].cells).toEqual([{ kind: 'template', text: 'What is your name?' }]);
    expect(r[3].step).toEqual([3]);
    expect(r[3].operatorId).toBe('Op.Exit');
  });

  it('merges consecutive comment lines into a single divider row', () => {
    const src = [
      "' @example demo",
      "' @status stable",
      "' @description Hello World — multi-line header",
      "EXIT",
    ].join('\n');
    const r = rows(src, en);
    expect(r).toHaveLength(2);
    expect(r[0].mode).toBe('divider');
    expect(r[0].cells).toHaveLength(1);
    expect(r[0].cells[0]).toEqual({
      kind: 'text',
      text: '@example demo\n@status stable\n@description Hello World — multi-line header',
    });
    expect(r[1].step).toEqual([1]);
    expect(r[1].operatorId).toBe('Op.Exit');
  });

  it('blank line between comments does not break the merge chain', () => {
    const src = [
      "' first block line 1",
      "' first block line 2",
      "",
      "' second block",
      "EXIT",
    ].join('\n');
    const r = rows(src, en);
    const dividers = r.filter(row => row.mode === 'divider');
    // Blank lines do not produce comment nodes, but they also don't break
    // the divider chain — subsequent comments still merge into the same
    // block since the previous row is still a divider. This matches the
    // pre-5c5d8a0 behaviour: an operator (or no row at all) is what resets
    // the merge chain.
    expect(dividers).toHaveLength(1);
    expect(dividers[0].cells[0]).toEqual({
      kind: 'text',
      text: 'first block line 1\nfirst block line 2\nsecond block',
    });
  });

  it('operator between comments starts a new divider row', () => {
    const src = [
      "' header A",
      "' header A continued",
      "EXIT",
      "' header B",
      "' header B continued",
      "EXIT",
    ].join('\n');
    const r = rows(src, en);
    expect(r).toHaveLength(4);
    expect(r[0].mode).toBe('divider');
    expect(r[0].cells[0]).toEqual({
      kind: 'text',
      text: 'header A\nheader A continued',
    });
    expect(r[1].operatorId).toBe('Op.Exit');
    expect(r[2].mode).toBe('divider');
    expect(r[2].cells[0]).toEqual({
      kind: 'text',
      text: 'header B\nheader B continued',
    });
    expect(r[3].operatorId).toBe('Op.Exit');
  });
});

// ── Invariant: no physical <<>> in any template cell ──────

describe('no physical <<>> in template cells', () => {
  it('template cells never contain << or >> markers', () => {
    const src = [
      'ДУМАЙ step',
      '  ЦЕЛЬ <<',
      '  Do X.',
      '  >>',
      '  РЕЗУЛЬТАТ',
      '  * out: ТЕКСТ - результат',
      '  <<',
      '  Extra.',
      '  >>',
      'КОНЕЦ',
      '',
      'ОПРЕДЕЛИ msg',
      '<<',
      'Hello!',
      '>>',
      'КОНЕЦ',
    ].join('\n');
    const r = rows(src, ru);

    for (const row of r) {
      for (const cell of row.cells) {
        if (cell.kind === 'template') {
          expect(cell.text).not.toContain('<<');
          expect(cell.text).not.toContain('>>');
        }
        if (cell.kind === 'modifier' && cell.value.kind === 'template') {
          expect(cell.value.text).not.toContain('<<');
          expect(cell.value.text).not.toContain('>>');
        }
      }
    }
  });
});
