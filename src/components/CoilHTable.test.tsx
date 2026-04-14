import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import {
  tokenize,
  parse,
  KeywordIndex,
  type DialectTable,
} from 'coil-runtime/browser';
import { astToCoilH } from '../coil/coil-h';
import { CoilHTable } from './CoilHTable';
import enStandard from 'coil/dialects/en-standard/en-standard.json';
import ruStandard from 'coil/dialects/ru-standard/ru-standard.json';

const en = enStandard as DialectTable;
const ru = ruStandard as DialectTable;

afterEach(() => {
  cleanup();
});

function renderTable(source: string, dialect: DialectTable = ru) {
  const index = KeywordIndex.build(dialect);
  const tokens = tokenize(source, index);
  const ast = parse(tokens, dialect, source);
  const rows = astToCoilH(ast, source, dialect);
  return render(<CoilHTable rows={rows} dialect={dialect} />);
}

function row(stepDots: string): HTMLElement {
  const el = document.getElementById(`step-${stepDots}`);
  if (!el) throw new Error(`row #step-${stepDots} not found`);
  return el;
}

describe('CoilHTable: row anchors', () => {
  it('every full-mode row gets id="step-N.M"', () => {
    const src = [
      'ACTORS user',
      'RECEIVE name',
      '<<',
      'Hi',
      '>>',
      'END',
      'EXIT',
    ].join('\n');
    renderTable(src, en);
    expect(document.getElementById('step-1')).not.toBeNull();
    expect(document.getElementById('step-2')).not.toBeNull();
    expect(document.getElementById('step-3')).not.toBeNull();
  });

  it('nested operator gets hierarchical id', () => {
    const src = [
      'IF $x = 1',
      '  EXIT',
      'END',
    ].join('\n');
    renderTable(src, en);
    expect(document.getElementById('step-1')).not.toBeNull();
    expect(document.getElementById('step-1.1')).not.toBeNull();
  });
});

describe('CoilHTable: RefLink rendering', () => {
  it('resolved ref renders as anchor with correct href and class', () => {
    const src = [
      'DEFINE name',
      '"Alice"',
      'END',
      '',
      'RECEIVE answer',
      '<<',
      'Hello, $name!',
      '>>',
      'END',
    ].join('\n');
    renderTable(src, en);
    const link = row('2').querySelector('a.coil-h-ref');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('#step-1');
    expect(link!.className).toContain('coil-h-ref--ref');
    expect(link!.textContent).toBe('$name');
  });

  it('unresolved ref renders as <span> without anchor', () => {
    const src = [
      'RECEIVE q',
      '<<',
      'Hi $undeclared!',
      '>>',
      'END',
    ].join('\n');
    renderTable(src, en);
    const r = row('1');
    expect(r.querySelector('a.coil-h-ref')).toBeNull();
    const span = r.querySelector('span.coil-h-ref--unresolved');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('$undeclared');
  });

  it('dynamic ref carries coil-h-ref--dynamic class', () => {
    const src = [
      'ACTORS analyst',
      'DEFINE assignee',
      '$analyst',
      'END',
      '',
      'SEND',
      '  TO #main',
      '  FOR @$assignee',
      '<<',
      'Hi',
      '>>',
      'END',
    ].join('\n');
    renderTable(src, en);
    const dynamicLink = row('3').querySelector('.coil-h-ref--dynamic');
    expect(dynamicLink).not.toBeNull();
    expect(dynamicLink!.className).toContain('coil-h-ref--participant');
    expect(dynamicLink!.textContent).toBe('@$assignee');
  });

  it('multi-ref (kind=refs) renders N anchors separated by ", "', () => {
    const src = [
      'ИНСТРУМЕНТЫ search, calc',
      'ДУМАЙ step',
      '  ИСПОЛЬЗУЯ !search, !calc',
      '  ЦЕЛЬ <<',
      '  Find.',
      '  >>',
      '  РЕЗУЛЬТАТ',
      '  * out: ТЕКСТ - ответ',
      'КОНЕЦ',
    ].join('\n');
    renderTable(src, ru);
    const links = Array.from(row('2').querySelectorAll('a.coil-h-ref--tool'));
    expect(links).toHaveLength(2);
    expect(links.map(a => a.textContent)).toEqual(['!search', '!calc']);
    expect(row('2').textContent).toContain('!search, !calc');
  });
});
