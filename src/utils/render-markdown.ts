import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { CoilHRef, CoilHSegment, Sigil } from '../coil/coil-h';

// Mirrors the SIGIL_CLASS map in CoilHTable.tsx (I-0012). Kept duplicated
// rather than imported from a React module so this file stays usable from
// non-React contexts (headless export, server-side rendering).
const SIGIL_CLASS: Record<Sigil, string> = {
  '$': 'coil-h-ref--ref',
  '@': 'coil-h-ref--participant',
  '!': 'coil-h-ref--tool',
  '#': 'coil-h-ref--channel',
  '?': 'coil-h-ref--promise',
  '~': 'coil-h-ref--stream',
};

function refText(ref: CoilHRef): string {
  const prefix = ref.dynamic ? `${ref.sigil}$` : ref.sigil;
  const path = ref.path.length ? '.' + ref.path.join('.') : '';
  return `${prefix}${ref.name}${path}`;
}

function refToHtml(ref: CoilHRef): string {
  const sigilClass = SIGIL_CLASS[ref.sigil];
  const dynClass = ref.dynamic ? ' coil-h-ref--dynamic' : '';
  const text = escapeHtml(refText(ref));
  if (ref.targetStep === null) {
    return `<span class="coil-h-ref ${sigilClass}${dynClass} coil-h-ref--unresolved">${text}</span>`;
  }
  const targetId = `step-${ref.targetStep.join('.')}`;
  // `data-coil-h-ref="1"` lets a click delegate (added by the React
  // component) intercept navigation and apply smooth scrolling, since the
  // anchors here live inside dangerouslySetInnerHTML and have no handlers.
  return `<a href="#${targetId}" class="coil-h-ref ${sigilClass}${dynClass}" data-coil-h-ref="1">${text}</a>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Placeholder stays inside Markdown unchanged: an inline token of the
// shape `\u0000COILREF<n>\u0000` survives `marked.parse` because it
// contains no Markdown-significant characters. We then swap each
// placeholder for the rendered ref `<a>` HTML.
const PLACEHOLDER_RE = /\u0000COILREF(\d+)\u0000/g;

function placeholderFor(i: number): string {
  return `\u0000COILREF${i}\u0000`;
}

/**
 * Render `CoilHSegment[]` as sanitized HTML with Markdown formatting on
 * text segments and clickable anchors on ref segments. Two-pass:
 *   1. Build flat text where each ref becomes a unique placeholder; pass
 *      every text-segment through `renderTextSegment` (translation hook,
 *      I-0014) before joining.
 *   2. Run `marked.parse` on the flat text → HTML.
 *   3. Replace placeholders with anchor HTML built from the original refs.
 *   4. Sanitize through `DOMPurify`, allow our `<a>` whitelist.
 *
 * Refs cannot collide with Markdown structure because their placeholders
 * contain only non-Markdown characters.
 */
export function renderSegmentsAsHtml(
  segments: CoilHSegment[],
  renderTextSegment?: (text: string) => string,
): string {
  const transform = renderTextSegment ?? ((t: string) => t);
  const refs: CoilHRef[] = [];
  let buffer = '';
  for (const seg of segments) {
    if (seg.kind === 'text') {
      buffer += transform(seg.text);
    } else {
      buffer += placeholderFor(refs.length);
      refs.push(seg.ref);
    }
  }
  // `marked.parse` is async-aware; we use the sync default with `async: false`.
  const rawHtml = marked.parse(buffer, { async: false }) as string;
  const withRefs = rawHtml.replace(PLACEHOLDER_RE, (_m, idxStr) => refToHtml(refs[Number(idxStr)]));
  return DOMPurify.sanitize(withRefs, {
    ADD_ATTR: ['data-coil-h-ref'],
    // Default DOMPurify allowlist already covers <a>, <h1>-<h6>, <ul>, <ol>,
    // <li>, <p>, <code>, <pre>, <strong>, <em>, <blockquote>. We only need to
    // allow our custom data-attribute on top.
  });
}
