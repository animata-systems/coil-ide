import { describe, it, expect } from 'vitest';
import type { Token, DialectTable, SourceSpan } from 'coil-runtime/browser';
import { mapTokenToScope, tokenizeToLineTokens } from './tokens-to-monaco';
import enStandard from 'coil/dialects/en-standard/en-standard.json';
import ruStandard from 'coil/dialects/ru-standard/ru-standard.json';

const en = enStandard as DialectTable;
const ru = ruStandard as DialectTable;

const span: SourceSpan = { line: 1, col: 1, offset: 0, length: 1 };

// ── mapTokenToScope: per-type ──────────────────────────────

describe('mapTokenToScope', () => {
  it('Keyword Op.* → keyword.operator', () => {
    const t: Token = { type: 'Keyword', ids: ['Op.Send'], span };
    expect(mapTokenToScope(t)).toBe('keyword.operator');
  });

  it('Keyword Mod.* → keyword.modifier', () => {
    const t: Token = { type: 'Keyword', ids: ['Mod.Goal'], span };
    expect(mapTokenToScope(t)).toBe('keyword.modifier');
  });

  it('Keyword Pol.* → keyword.policy', () => {
    const t: Token = { type: 'Keyword', ids: ['Pol.All'], span };
    expect(mapTokenToScope(t)).toBe('keyword.policy');
  });

  it('Keyword Typ.* → keyword.type', () => {
    const t: Token = { type: 'Keyword', ids: ['Typ.Text'], span };
    expect(mapTokenToScope(t)).toBe('keyword.type');
  });

  it('Keyword Kw.End → keyword.terminator', () => {
    const t: Token = { type: 'Keyword', ids: ['Kw.End'], span };
    expect(mapTokenToScope(t)).toBe('keyword.terminator');
  });

  it('Keyword Expr.* → keyword.expression', () => {
    const t: Token = { type: 'Keyword', ids: ['Expr.And'], span };
    expect(mapTokenToScope(t)).toBe('keyword.expression');
  });

  it('Identifier → identifier', () => {
    expect(mapTokenToScope({ type: 'Identifier', name: 'foo', span })).toBe('identifier');
  });

  it('typed refs map to entity.* / variable', () => {
    expect(mapTokenToScope({ type: 'ValueRef', name: 'x', path: [], span })).toBe('variable');
    expect(mapTokenToScope({
      type: 'ParticipantRef',
      ref: { kind: 'literal', value: 'a' },
      span,
    })).toBe('entity.participant');
    expect(mapTokenToScope({
      type: 'ChannelRef',
      segments: [{ kind: 'literal', value: 'main' }],
      span,
    })).toBe('entity.channel');
    expect(mapTokenToScope({ type: 'PromiseRef', name: 'p', span })).toBe('entity.promise');
    expect(mapTokenToScope({
      type: 'ToolRef',
      ref: { kind: 'literal', value: 's' },
      span,
    })).toBe('entity.tool');
    expect(mapTokenToScope({ type: 'StreamRef', name: 's', span })).toBe('entity.stream');
  });

  it('templates map to delimiter.template / delimiter.heredoc / string.template', () => {
    expect(mapTokenToScope({ type: 'TemplateOpen', span })).toBe('delimiter.template');
    expect(mapTokenToScope({ type: 'TemplateClose', span })).toBe('delimiter.template');
    expect(mapTokenToScope({ type: 'HeredocOpen', marker: 'END', raw: false, span }))
      .toBe('delimiter.heredoc');
    expect(mapTokenToScope({ type: 'HeredocClose', marker: 'END', span }))
      .toBe('delimiter.heredoc');
    expect(mapTokenToScope({ type: 'TextFragment', value: 'hi', span })).toBe('string.template');
  });

  it('literals map to number.* / string', () => {
    expect(mapTokenToScope({ type: 'DurationLiteral', value: 30, unitId: 'Dur.Seconds', span }))
      .toBe('number.duration');
    expect(mapTokenToScope({ type: 'NumberLiteral', value: 42, span })).toBe('number');
    expect(mapTokenToScope({ type: 'StringLiteral', value: 's', span })).toBe('string');
  });

  it('Comparison → operator.comparison', () => {
    expect(mapTokenToScope({ type: 'Comparison', operator: '=', span })).toBe('operator.comparison');
  });

  it('Comment → comment', () => {
    expect(mapTokenToScope({ type: 'Comment', text: 'hi', span })).toBe('comment');
  });

  it('punctuation → delimiter', () => {
    for (const type of ['Star', 'Dash', 'Colon', 'Comma', 'ParenOpen', 'ParenClose'] as const) {
      expect(mapTokenToScope({ type, span } as Token)).toBe('delimiter');
    }
  });

  it('Newline / EOF → null (not surfaced)', () => {
    expect(mapTokenToScope({ type: 'Newline', span })).toBeNull();
    expect(mapTokenToScope({ type: 'EOF', span })).toBeNull();
  });
});

// ── tokenizeToLineTokens: real sources ─────────────────────

describe('tokenizeToLineTokens — typical sources', () => {
  it('empty source → one empty line, no errors', () => {
    const r = tokenizeToLineTokens('', en);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0].tokens).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  it('ACTORS line: keyword + identifier on first line', () => {
    const r = tokenizeToLineTokens('ACTORS user', en);
    expect(r.errors).toEqual([]);
    expect(r.lines).toHaveLength(1);
    const tokens = r.lines[0].tokens;
    expect(tokens[0]).toEqual({ startIndex: 0, scopes: 'keyword.operator' });
    expect(tokens[1]).toEqual({ startIndex: 7, scopes: 'identifier' });
  });

  it('lines parallel to source.split("\\n")', () => {
    const src = 'ACTORS u\nEXIT\n';
    const r = tokenizeToLineTokens(src, en);
    expect(r.lines).toHaveLength(src.split('\n').length); // = 3
    // Line 0: ACTORS, identifier
    expect(r.lines[0].tokens.length).toBeGreaterThanOrEqual(2);
    // Line 1: EXIT
    expect(r.lines[1].tokens[0]).toEqual({ startIndex: 0, scopes: 'keyword.operator' });
    // Line 2: empty (trailing \n)
    expect(r.lines[2].tokens).toEqual([]);
  });

  it('comment line → single comment token at column 0', () => {
    const r = tokenizeToLineTokens("' note", en);
    expect(r.lines[0].tokens).toEqual([{ startIndex: 0, scopes: 'comment' }]);
  });

  it('typed refs are highlighted with their entity scope', () => {
    const src = [
      'ACTORS analyst',
      'TOOLS search',
      'SEND',
      '  TO #main',
      '  FOR @analyst',
      '<<',
      'Hi',
      '>>',
      'END',
    ].join('\n');
    const r = tokenizeToLineTokens(src, en);
    expect(r.errors).toEqual([]);
    // FOR line: modifier + participant ref
    const forLine = r.lines[4].tokens.map(t => t.scopes);
    expect(forLine).toContain('keyword.modifier');
    expect(forLine).toContain('entity.participant');
    // TO line: modifier + channel ref
    const toLine = r.lines[3].tokens.map(t => t.scopes);
    expect(toLine).toContain('entity.channel');
  });

  it('standard template open/close emit delimiter.template', () => {
    const src = [
      'DEFINE m',
      '<<',
      'hi',
      '>>',
      'END',
    ].join('\n');
    const r = tokenizeToLineTokens(src, en);
    expect(r.errors).toEqual([]);
    expect(r.lines[1].tokens.some(t => t.scopes === 'delimiter.template')).toBe(true);
    expect(r.lines[3].tokens.some(t => t.scopes === 'delimiter.template')).toBe(true);
    // Body line carries string.template
    expect(r.lines[2].tokens.some(t => t.scopes === 'string.template')).toBe(true);
  });
});

// ── Heredoc cases ──────────────────────────────────────────

describe('tokenizeToLineTokens — heredoc forms (D-0050)', () => {
  it('heredoc with interpolation: open marker, body lines, close marker', () => {
    const src = [
      'DEFINE m',
      '<<END',
      'Hello $name',
      'and $other',
      'END',
      'KONEC',
    ].join('\n');
    // Use ru dialect so DEFINE is "ОПРЕДЕЛИ"; switch to en so it parses.
    const enSrc = src.replace('DEFINE', 'DEFINE').replace('KONEC', 'END');
    const r = tokenizeToLineTokens(enSrc, en);
    // line 1: HeredocOpen (whole "<<END")
    const openTokens = r.lines[1].tokens.map(t => t.scopes);
    expect(openTokens).toContain('delimiter.heredoc');
    // body lines: text fragments and refs
    const body1 = r.lines[2].tokens.map(t => t.scopes);
    expect(body1).toContain('string.template');
    expect(body1).toContain('variable'); // $name
    // close marker on its own line
    const closeTokens = r.lines[4].tokens.map(t => t.scopes);
    expect(closeTokens).toContain('delimiter.heredoc');
  });

  it("raw heredoc <<'TAG' interpolates nothing — body is one string segment", () => {
    const src = [
      "DEFINE m",
      "<<'RAW'",
      'Has $no interpolation',
      'RAW',
      'END',
    ].join('\n');
    const r = tokenizeToLineTokens(src, en);
    expect(r.errors).toEqual([]);
    // Body line carries only string.template, no variable
    const body = r.lines[2].tokens.map(t => t.scopes);
    expect(body).toContain('string.template');
    expect(body).not.toContain('variable');
  });

  it('unterminated heredoc → error captured, no throw', () => {
    const src = [
      'DEFINE m',
      '<<END',
      'no close',
    ].join('\n');
    const r = tokenizeToLineTokens(src, en);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0].message.toLowerCase()).toContain('heredoc');
    // Lines array still parallels source line count
    expect(r.lines.length).toBe(src.split('\n').length);
  });

  it('multi-line TextFragment in heredoc body splits across lines', () => {
    // Three text-only body lines — runtime emits a single TextFragment
    // covering the whole body with embedded \n. Adapter splits it so
    // each line carries its own string.template token at column 0.
    const src = [
      'DEFINE m',
      '<<END',
      'first',
      'second',
      'third',
      'END',
    ].join('\n');
    const r = tokenizeToLineTokens(src, en);
    expect(r.errors).toEqual([]);
    // Lines 2,3,4 (body) each get at least one string.template token at col 0
    for (const lineIdx of [2, 3, 4]) {
      const tokens = r.lines[lineIdx].tokens;
      const firstString = tokens.find(t => t.scopes === 'string.template');
      expect(firstString, `line ${lineIdx + 1}`).toBeDefined();
      expect(firstString!.startIndex).toBe(0);
    }
  });
});

// ── Sorting and edge cases ─────────────────────────────────

describe('tokenizeToLineTokens — invariants', () => {
  it('tokens within a line are sorted by startIndex', () => {
    const src = 'ACTORS user, admin';
    const r = tokenizeToLineTokens(src, en);
    const starts = r.lines[0].tokens.map(t => t.startIndex);
    const sorted = [...starts].sort((a, b) => a - b);
    expect(starts).toEqual(sorted);
  });

  it('works with ru-standard dialect (Cyrillic keywords)', () => {
    const src = 'УЧАСТНИКИ алиса\nВЫХОД';
    const r = tokenizeToLineTokens(src, ru);
    expect(r.errors).toEqual([]);
    expect(r.lines[0].tokens[0].scopes).toBe('keyword.operator');
    expect(r.lines[1].tokens[0].scopes).toBe('keyword.operator');
  });

  it('does not throw on garbled source — collects lexer errors', () => {
    // Lexer rejects '@@' as participant ref; surface it as an error,
    // not a thrown exception.
    const src = '@@';
    const r = tokenizeToLineTokens(src, en);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.lines.length).toBe(1);
  });
});
