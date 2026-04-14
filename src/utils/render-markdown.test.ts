import { describe, it, expect } from 'vitest';
import { renderSegmentsAsHtml } from './render-markdown';
import type { CoilHRef, CoilHSegment } from '../coil/coil-h';

const text = (s: string): CoilHSegment => ({ kind: 'text', text: s });
const ref = (over: Partial<CoilHRef> = {}): CoilHSegment => ({
  kind: 'ref',
  ref: {
    sigil: '$',
    name: 'x',
    path: [],
    dynamic: false,
    targetStep: [3],
    ...over,
  },
});

describe('renderSegmentsAsHtml — Phase 3 smoke', () => {
  it('renders plain text as a Markdown paragraph', () => {
    const html = renderSegmentsAsHtml([text('hello world')]);
    expect(html).toContain('<p>hello world</p>');
  });

  it('renders **bold** and *italic* through Markdown', () => {
    const html = renderSegmentsAsHtml([text('this is **bold** and *em*')]);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>em</em>');
  });

  it('preserves ref segments as anchors with correct href and class', () => {
    const html = renderSegmentsAsHtml([
      text('see '),
      ref({ name: 'result', targetStep: [5] }),
      text(' for details'),
    ]);
    expect(html).toContain('href="#step-5"');
    expect(html).toContain('coil-h-ref--ref');
    expect(html).toContain('$result');
    expect(html).toContain('data-coil-h-ref="1"');
  });

  it('renders unresolved refs as <span> without anchor', () => {
    const html = renderSegmentsAsHtml([
      text('value '),
      ref({ name: 'unknown', targetStep: null }),
    ]);
    expect(html).not.toContain('href="#step-');
    expect(html).toContain('coil-h-ref--unresolved');
    expect(html).toContain('$unknown');
  });

  it('strips XSS via DOMPurify (script tags, event handlers)', () => {
    const html = renderSegmentsAsHtml([
      text('safe <script>alert(1)</script> text'),
    ]);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(1)');
  });

  it('passes text segments through renderTextSegment hook before Markdown', () => {
    const html = renderSegmentsAsHtml(
      [text('hello'), ref({ name: 'r', targetStep: [1] }), text(' world')],
      (s) => s.toUpperCase(),
    );
    expect(html).toContain('HELLO');
    expect(html).toContain('WORLD');
    // refs are NOT passed through the text transform
    expect(html).toContain('$r');
  });

  it('renders refs across Markdown boundaries (bold around a ref)', () => {
    const html = renderSegmentsAsHtml([
      text('**strong '),
      ref({ name: 'mid', targetStep: [2] }),
      text(' end**'),
    ]);
    expect(html).toContain('<strong>');
    expect(html).toContain('href="#step-2"');
    // strong wrapper survives the placeholder swap
    const idx = html.indexOf('<strong>');
    const closeIdx = html.indexOf('</strong>');
    expect(closeIdx).toBeGreaterThan(idx);
    expect(html.slice(idx, closeIdx)).toContain('href="#step-2"');
  });

  it('renders Markdown lists', () => {
    const html = renderSegmentsAsHtml([
      text('Items:\n- one\n- two\n- three'),
    ]);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
    expect(html).toContain('<li>three</li>');
  });

  it('renders fenced code blocks without anchor injection inside', () => {
    const html = renderSegmentsAsHtml([
      text('Example:\n```\nlet x = 1;\n```'),
    ]);
    expect(html).toMatch(/<pre>[\s\S]*<code[\s\S]*let x = 1;[\s\S]*<\/code>[\s\S]*<\/pre>/);
  });

  it('renders multiple paragraphs separated by blank lines', () => {
    const html = renderSegmentsAsHtml([text('first para\n\nsecond para')]);
    const matches = html.match(/<p>/g);
    expect(matches).toHaveLength(2);
    expect(html).toContain('first para');
    expect(html).toContain('second para');
  });

  it('renders headings', () => {
    const html = renderSegmentsAsHtml([text('# H1\n\n## H2\n\n### H3')]);
    expect(html).toContain('<h1>H1</h1>');
    expect(html).toContain('<h2>H2</h2>');
    expect(html).toContain('<h3>H3</h3>');
  });

  it('blocks javascript: URLs in user-provided Markdown links', () => {
    const html = renderSegmentsAsHtml([
      text('[click me](javascript:alert(1))'),
    ]);
    expect(html).not.toContain('javascript:');
    // DOMPurify drops dangerous href but typically keeps anchor text or strips
    // the anchor entirely — both are acceptable safe outcomes.
  });

  it('blocks event-handler attributes from user-injected HTML', () => {
    const html = renderSegmentsAsHtml([
      text('<img src=x onerror="alert(1)">'),
    ]);
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(1)');
  });

  it('handles refs with path (e.g. $config.mode) — text uses dot notation', () => {
    const html = renderSegmentsAsHtml([
      text('Use '),
      ref({ name: 'config', path: ['mode'], targetStep: [1] }),
    ]);
    expect(html).toContain('$config.mode');
    expect(html).toContain('href="#step-1"');
  });

  it('handles dynamic refs with `--dynamic` class', () => {
    const html = renderSegmentsAsHtml([
      ref({ sigil: '@', name: 'assignee', dynamic: true, targetStep: [4] }),
    ]);
    expect(html).toContain('coil-h-ref--participant');
    expect(html).toContain('coil-h-ref--dynamic');
    expect(html).toContain('@$assignee');
    expect(html).toContain('href="#step-4"');
  });

  it('preserves identity of multiple refs in order', () => {
    const html = renderSegmentsAsHtml([
      text('a '),
      ref({ name: 'one', targetStep: [1] }),
      text(' b '),
      ref({ name: 'two', targetStep: [2] }),
      text(' c'),
    ]);
    expect(html.indexOf('$one')).toBeLessThan(html.indexOf('$two'));
    expect(html).toContain('href="#step-1"');
    expect(html).toContain('href="#step-2"');
  });

  it('handles ~50 ref segments without placeholder collisions', () => {
    const segments: CoilHSegment[] = [];
    for (let i = 0; i < 50; i++) {
      segments.push(text(`item${i} `));
      segments.push(ref({ name: `r${i}`, targetStep: [i + 1] }));
      segments.push(text(' '));
    }
    const html = renderSegmentsAsHtml(segments);
    for (let i = 0; i < 50; i++) {
      expect(html).toContain(`$r${i}`);
      expect(html).toContain(`href="#step-${i + 1}"`);
    }
    // No placeholder leakage.
    expect(html).not.toContain('COILREF');
  });
});
