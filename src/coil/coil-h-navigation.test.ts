import { describe, it, expect } from 'vitest';
import {
  tokenize,
  parse,
  KeywordIndex,
  type DialectTable,
  type ScriptNode,
  type TemplateNode,
} from 'coil-runtime/browser';
import {
  buildDeclarationIndex,
  templateToSegments,
} from './coil-h';
import enStandard from 'coil/dialects/en-standard/en-standard.json';

const en = enStandard as DialectTable;

function parseScript(source: string): ScriptNode {
  const idx = KeywordIndex.build(en);
  const tokens = tokenize(source, idx);
  return parse(tokens, en, source);
}

describe('buildDeclarationIndex', () => {
  it('indexes ACTORS names with @-prefix', () => {
    const ast = parseScript('ACTORS alice, bob');
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('@alice')).toEqual([1]);
    expect(idx.get('@bob')).toEqual([1]);
  });

  it('indexes TOOLS names with !-prefix', () => {
    const ast = parseScript('TOOLS search, calc');
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('!search')).toEqual([1]);
    expect(idx.get('!calc')).toEqual([1]);
  });

  it('indexes DEFINE with $-prefix on the operator step', () => {
    const ast = parseScript('DEFINE x\n42\nEND\nDEFINE y\n"hi"\nEND');
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('$x')).toEqual([1]);
    expect(idx.get('$y')).toEqual([2]);
  });

  it('I-0013: named operators index both $<name> AND ?<name>', () => {
    const ast = parseScript([
      'RECEIVE q1',
      '<<',
      'Hi',
      '>>',
      'END',
      '',
      'EXECUTE r2',
      '  USING !search',
      '  - q: "test"',
      'END',
    ].join('\n'));
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('$q1')).toEqual([1]);
    expect(idx.get('?q1')).toEqual([1]);
    expect(idx.get('$r2')).toEqual([2]);
    expect(idx.get('?r2')).toEqual([2]);
  });

  it('first-wins on duplicate names: SET does not shadow DEFINE', () => {
    const ast = parseScript([
      'DEFINE x',
      '0',
      'END',
      'SET $x',
      '1',
      'END',
    ].join('\n'));
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('$x')).toEqual([1]);  // DEFINE row, not SET
  });

  it('Op.Each declares element on its own row; nested ops index hierarchical step', () => {
    const ast = parseScript([
      'DEFINE list',
      '0',
      'END',
      'EACH $item FROM $list',
      '  DEFINE inner',
      '  $item',
      '  END',
      'END',
    ].join('\n'));
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('$list')).toEqual([1]);
    expect(idx.get('$item')).toEqual([2]);            // EACH row itself
    expect(idx.get('$inner')).toEqual([2, 1]);        // nested DEFINE
  });

  it('IF body indexes nested operators with hierarchical step', () => {
    const ast = parseScript([
      'IF $cond = 1',
      '  DEFINE inside',
      '  "yes"',
      '  END',
      'END',
    ].join('\n'));
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('$inside')).toEqual([1, 1]);
  });

  it('SIGNAL indexes ~stream', () => {
    const ast = parseScript([
      'SIGNAL ~updates',
      '<<',
      'data',
      '>>',
      'END',
    ].join('\n'));
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('~updates')).toEqual([1]);
  });

  it('comments do not shift step numbering', () => {
    const ast = parseScript([
      "' header",
      'DEFINE x',
      '1',
      'END',
    ].join('\n'));
    const idx = buildDeclarationIndex(ast.nodes);
    expect(idx.get('$x')).toEqual([1]);
  });
});

describe('templateToSegments', () => {
  function parseTemplate(source: string): TemplateNode {
    // Wrap into a DEFINE so the parser produces a TemplateNode body.
    const ast = parseScript(`DEFINE m\n<< ${source} >>\nEND`);
    const node = ast.nodes[0];
    if (node.kind !== 'Op.Define' || node.body.type !== 'template') {
      throw new Error('expected DEFINE with template body');
    }
    return node.body;
  }

  it('text-only template → single text segment', () => {
    const tpl = parseTemplate('hello world');
    const segs = templateToSegments(tpl, new Map());
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ kind: 'text', text: ' hello world ' });
  });

  it('template with $ref → text + ref + text segments', () => {
    const tpl = parseTemplate('Hi $name!');
    const idx = new Map([['$name', [5]]]);
    const segs = templateToSegments(tpl, idx);
    expect(segs).toHaveLength(3);
    expect(segs[0]).toEqual({ kind: 'text', text: ' Hi ' });
    expect(segs[1]).toEqual({
      kind: 'ref',
      ref: { sigil: '$', name: 'name', path: [], dynamic: false, targetStep: [5] },
    });
    expect(segs[2]).toEqual({ kind: 'text', text: '! ' });
  });

  it('unresolved ref → targetStep null', () => {
    const tpl = parseTemplate('Hi $unknown');
    const segs = templateToSegments(tpl, new Map());
    const refSeg = segs.find(s => s.kind === 'ref');
    expect(refSeg).toBeDefined();
    if (refSeg?.kind === 'ref') {
      expect(refSeg.ref.targetStep).toBeNull();
    }
  });

  it('ref with path is preserved in segment', () => {
    const tpl = parseTemplate('use $cfg.mode');
    const idx = new Map([['$cfg', [3]]]);
    const segs = templateToSegments(tpl, idx);
    const refSeg = segs.find(s => s.kind === 'ref');
    if (refSeg?.kind === 'ref') {
      expect(refSeg.ref.name).toBe('cfg');
      expect(refSeg.ref.path).toEqual(['mode']);
      expect(refSeg.ref.targetStep).toEqual([3]);
    }
  });

  it('multiple refs in one template are all segmented', () => {
    const tpl = parseTemplate('$a + $b = $c');
    const idx = new Map([['$a', [1]], ['$b', [2]], ['$c', [3]]]);
    const segs = templateToSegments(tpl, idx);
    const refs = segs.filter(s => s.kind === 'ref');
    expect(refs).toHaveLength(3);
    if (refs[0].kind === 'ref') expect(refs[0].ref.targetStep).toEqual([1]);
    if (refs[1].kind === 'ref') expect(refs[1].ref.targetStep).toEqual([2]);
    if (refs[2].kind === 'ref') expect(refs[2].ref.targetStep).toEqual([3]);
  });
});
