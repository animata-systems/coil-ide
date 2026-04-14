import type {
  ScriptNode,
  TemplateNode,
  SendNode,
  ReceiveNode,
  ThinkNode,
  ExecuteNode,
  WaitNode,
  IfNode,
  RepeatNode,
  EachNode,
  DialectTable,
  BodyValue,
  ResultField,
  ArgEntry,
  OperatorNode,
  CommentNode,
  ExpressionNode,
  ChannelRef,
  ParticipantRef,
  ToolRef,
  PromiseRef,
  ValueRef,
} from 'coil-runtime/browser';

// ── Structural cells (I-0005, I-0010) ──────────────────────
//
// Cells carry structured content. Reference information flows from
// AST through COIL-H to the renderer via `CoilHSegment[]` — that lets
// the view layer render clickable links and resolve targets.
//
// Physical template markers `<<>>` and modifier/value separation live
// in the renderer, not in the data. Templates carry segments without
// `<<`/`>>` wrappers.

export type Sigil = '$' | '@' | '!' | '#' | '?' | '~';

export interface CoilHRef {
  sigil: Sigil;
  name: string;
  path: string[];
  /** `true` when the name is a `$`-substitution (e.g. `@$assignee`). */
  dynamic: boolean;
  /** Step where the name is declared; `null` if unresolved/external. */
  targetStep: number[] | null;
}

export type CoilHSegment =
  | { kind: 'text'; text: string }
  | { kind: 'ref'; ref: CoilHRef };

export type CoilHValue =
  | { kind: 'plain'; text: string }
  | { kind: 'template'; segments: CoilHSegment[] }
  | { kind: 'ref'; ref: CoilHRef }
  | { kind: 'refs'; refs: CoilHRef[] };

export interface ResultFieldRow {
  name: string;
  type: string;
  description: string;
  depth: number;
}

export type CoilHCell =
  | { kind: 'modifier'; label: string; value: CoilHValue }
  | { kind: 'template'; segments: CoilHSegment[] }
  | { kind: 'result-block'; label: string; fields: ResultFieldRow[] }
  | { kind: 'args-block'; args: { key: string; value: CoilHSegment[] }[] }
  | { kind: 'text'; text: string };

export interface CoilHRow {
  step: number[] | null;
  operatorId: string;
  cells: CoilHCell[];
  name: string;
  mode: 'full' | 'degraded' | 'divider';
  /** Flat-text renderings of templates for translation matching (full mode only) */
  templates: string[];
}

// ── Declaration index ─────────────────────────────────────
//
// First pass over the AST. Maps `${sigil}${name}` → step where the
// name is declared. First-wins on duplicates.

export type DeclarationIndex = Map<string, number[]>;

function indexNodes(
  nodes: (OperatorNode | CommentNode)[],
  prefix: number[],
  map: DeclarationIndex,
): void {
  let counter = 0;
  for (const node of nodes) {
    if (node.kind === 'Comment') continue;
    counter++;
    const step = [...prefix, counter];

    const addOnce = (key: string) => {
      if (!map.has(key)) map.set(key, step);
    };

    switch (node.kind) {
      case 'Op.Actors':
        for (const n of node.names) addOnce(`@${n}`);
        break;
      case 'Op.Tools':
        for (const n of node.names) addOnce(`!${n}`);
        break;
      case 'Op.Define':
        addOnce(`$${node.name}`);
        break;
      case 'Op.Set':
        // SET mutates an existing binding; do not shadow the original
        // declaration, just register the target if not already indexed.
        addOnce(`$${node.target.name}`);
        break;
      case 'Op.Receive':
      case 'Op.Think':
      case 'Op.Execute':
        // I-0013: named operator declares both `$<name>` (value) and
        // `?<name>` (promise/handle). WAIT ON ?ref resolves to the
        // operator that produced it.
        addOnce(`$${node.name}`);
        addOnce(`?${node.name}`);
        break;
      case 'Op.Send':
        if (node.name) {
          addOnce(`$${node.name}`);
          addOnce(`?${node.name}`);
        }
        break;
      case 'Op.Wait':
        if (node.name) {
          addOnce(`$${node.name}`);
          addOnce(`?${node.name}`);
        }
        break;
      case 'Op.Signal':
        addOnce(`~${node.target.name}`);
        break;
      case 'Op.If':
      case 'Op.Repeat':
        indexNodes(node.body, step, map);
        break;
      case 'Op.Each':
        // `element` is declared at the EACH row itself — nested operators
        // resolve `$element` to the EACH step.
        addOnce(`$${node.element.name}`);
        indexNodes(node.body, step, map);
        break;
    }
  }
}

export function buildDeclarationIndex(nodes: (OperatorNode | CommentNode)[]): DeclarationIndex {
  const map: DeclarationIndex = new Map();
  indexNodes(nodes, [], map);
  return map;
}

// ── Segment helpers ────────────────────────────────────────

function lookup(index: DeclarationIndex, sigil: Sigil, name: string): number[] | null {
  return index.get(`${sigil}${name}`) ?? null;
}

function makeRef(
  sigil: Sigil,
  name: string,
  path: string[],
  dynamic: boolean,
  index: DeclarationIndex,
): CoilHRef {
  // Dynamic refs always resolve through the `$`-name of the variable
  // that supplies the value, regardless of the outer sigil.
  const resolveSigil: Sigil = dynamic ? '$' : sigil;
  return {
    sigil,
    name,
    path,
    dynamic,
    targetStep: lookup(index, resolveSigil, name),
  };
}

function textSeg(text: string): CoilHSegment {
  return { kind: 'text', text };
}

function refSeg(ref: CoilHRef): CoilHSegment {
  return { kind: 'ref', ref };
}

export function templateToSegments(tpl: TemplateNode, index: DeclarationIndex): CoilHSegment[] {
  return tpl.parts.map((p): CoilHSegment =>
    p.type === 'text'
      ? textSeg(p.value)
      : refSeg(makeRef('$', p.name, p.path, false, index)),
  );
}

function trimSegments(segments: CoilHSegment[]): CoilHSegment[] {
  if (segments.length === 0) return segments;
  const copy = segments.slice();
  const first = copy[0];
  if (first.kind === 'text') {
    const trimmed = first.text.replace(/^\s+/, '');
    copy[0] = trimmed === '' ? first : { kind: 'text', text: trimmed };
    if (trimmed === '') copy.shift();
  }
  if (copy.length === 0) return copy;
  const last = copy[copy.length - 1];
  if (last.kind === 'text') {
    const trimmed = last.text.replace(/\s+$/, '');
    if (trimmed === '') copy.pop();
    else copy[copy.length - 1] = { kind: 'text', text: trimmed };
  }
  return copy;
}

export function segmentsToText(segments: CoilHSegment[]): string {
  return segments.map(s =>
    s.kind === 'text'
      ? s.text
      : `${s.ref.dynamic ? `${s.ref.sigil}$` : s.ref.sigil}${s.ref.name}${s.ref.path.map(f => `.${f}`).join('')}`,
  ).join('');
}

// ── Legacy flat-text helpers (kept for bodyValueToText callers) ─────

export function refToText(name: string, path: string[]): string {
  return `$${name}${path.length ? '.' + path.join('.') : ''}`;
}

export function templateToText(tpl: TemplateNode): string {
  return tpl.parts.map(p =>
    p.type === 'text' ? p.value : refToText(p.name, p.path),
  ).join('');
}

/**
 * Flat-text rendering of a non-template body value (ref / string / number).
 * Templates are never passed through this — they become structural
 * `CoilHValue.kind='template'` cells.
 */
export function bodyValueToText(body: BodyValue): string {
  switch (body.type) {
    case 'template':
      // Kept for backward compatibility with the test of the same name;
      // structural code paths never call this with a template.
      return `<< ${templateToText(body).trim()} >>`;
    case 'ref':
      return refToText(body.name, body.path);
    case 'string':
      return body.value;
    case 'number':
      return String(body.value);
    case 'boolean':
      return String(body.value);
  }
}

// ── Typed-ref adapters ─────────────────────────────────────

function valueRefToRef(ref: ValueRef, index: DeclarationIndex): CoilHRef {
  return makeRef('$', ref.name, ref.path, false, index);
}

function participantRefToRef(ref: ParticipantRef, index: DeclarationIndex): CoilHRef {
  if (ref.ref.kind === 'literal') {
    return makeRef('@', ref.ref.value, [], false, index);
  }
  return makeRef('@', ref.ref.name, ref.ref.path, true, index);
}

function toolRefToRef(ref: ToolRef, index: DeclarationIndex): CoilHRef {
  if (ref.ref.kind === 'literal') {
    return makeRef('!', ref.ref.value, [], false, index);
  }
  return makeRef('!', ref.ref.name, ref.ref.path, true, index);
}

function promiseRefToRef(ref: PromiseRef, index: DeclarationIndex): CoilHRef {
  return makeRef('?', ref.name, [], false, index);
}

function channelRefToSegments(ref: ChannelRef, index: DeclarationIndex): CoilHSegment[] {
  // `#a/b/$c` becomes segments where literal parts accumulate into a
  // single `text` segment prefixed with `#`, and dynamic parts become
  // refs resolving to the underlying `$name`.
  const segments: CoilHSegment[] = [];
  let buffer = '#';
  for (let i = 0; i < ref.segments.length; i++) {
    const s = ref.segments[i];
    const sep = i === 0 ? '' : '/';
    if (s.kind === 'literal') {
      buffer += sep + s.value;
    } else {
      buffer += sep;
      if (buffer) segments.push(textSeg(buffer));
      buffer = '';
      segments.push(refSeg(makeRef('#', s.name, s.path, true, index)));
    }
  }
  if (buffer) segments.push(textSeg(buffer));
  return segments;
}

// ── Value constructors ─────────────────────────────────────

function plain(text: string): CoilHValue {
  return { kind: 'plain', text };
}

function tplValue(segments: CoilHSegment[]): CoilHValue {
  return { kind: 'template', segments };
}

function refValue(ref: CoilHRef): CoilHValue {
  return { kind: 'ref', ref };
}

/**
 * Build a modifier value for a multi-ref field (`FOR`, `USING`, `AS`, `ON`).
 * Always produces `kind='refs'`, even for a single element — this matches
 * the AST shape (`ParticipantRef[]`, `ToolRef[]`, …) and keeps the
 * renderer path uniform across single and multiple refs. The separator
 * (`, ` by default) is the renderer's concern.
 */
function refsValue(refs: CoilHRef[]): CoilHValue {
  return { kind: 'refs', refs };
}

function durationText(
  timeout: { value: number; unitId: string },
  dialect: DialectTable,
): string {
  const suffix = (dialect.durationSuffixes as Record<string, string>)[timeout.unitId] ?? '';
  return `${timeout.value}${suffix}`;
}

function argValueToSegments(value: ArgEntry['value'], index: DeclarationIndex): CoilHSegment[] {
  switch (value.type) {
    case 'ref':
      return [refSeg(valueRefToRef(value, index))];
    case 'string':
      return [textSeg(value.value)];
    case 'number':
      return [textSeg(String(value.value))];
  }
}

function buildResultFields(fields: ResultField[], dialect: DialectTable): ResultFieldRow[] {
  return fields.map(f => {
    let typeName = (dialect.resultTypes as Record<string, string>)[f.typeId] ?? f.typeId;
    if (f.typeArgs.length > 0) {
      typeName += `(${f.typeArgs.join(', ')})`;
    }
    return {
      name: f.name,
      type: typeName,
      description: f.description ?? '',
      depth: f.depth,
    };
  });
}

function segmentsFromTemplate(tpl: TemplateNode, index: DeclarationIndex): CoilHSegment[] {
  return trimSegments(templateToSegments(tpl, index));
}

function segmentsNonEmpty(segments: CoilHSegment[]): boolean {
  return segments.some(s => s.kind === 'ref' || s.text.length > 0);
}

// ── Per-operator cell builders ─────────────────────────────

function buildSendCells(node: SendNode, dialect: DialectTable, index: DeclarationIndex): CoilHCell[] {
  const cells: CoilHCell[] = [];

  if (node.to) {
    const segs = channelRefToSegments(node.to, index);
    // Channels currently have no declaration operator, so a purely
    // literal channel (`#main`, `#support/tickets`) is non-navigable —
    // render as `plain` text. TODO: when a `CHANNEL` declaration op
    // lands, promote this to `kind='ref'` with `sigil='#'` and fill
    // `targetStep`. Composite channels (containing dynamic segments)
    // stay as `template` because the `$var` parts still need to be
    // clickable refs.
    if (segs.length === 1 && segs[0].kind === 'text') {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.To'],
        value: plain(segs[0].text),
      });
    } else {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.To'],
        value: tplValue(segs),
      });
    }
  }
  if (node.for.length > 0) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.For'],
      value: refsValue(node.for.map(p => participantRefToRef(p, index))),
    });
  }
  if (node.replyTo) {
    const segs = channelRefToSegments(node.replyTo, index);
    if (segs.length === 1 && segs[0].kind === 'text') {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.ReplyTo'],
        value: plain(segs[0].text),
      });
    } else {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.ReplyTo'],
        value: tplValue(segs),
      });
    }
  }
  if (node.await) {
    const policyMap: Record<string, string> = {
      none: dialect.policies['Pol.None'],
      any: dialect.policies['Pol.Any'],
      all: dialect.policies['Pol.All'],
    };
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Await'],
      value: plain(policyMap[node.await] ?? node.await),
    });
  }
  if (node.timeout) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Timeout'],
      value: plain(durationText(node.timeout, dialect)),
    });
  }

  if (node.body) {
    const segs = segmentsFromTemplate(node.body, index);
    if (segmentsNonEmpty(segs)) cells.push({ kind: 'template', segments: segs });
  }

  return cells;
}

function buildReceiveCells(node: ReceiveNode, index: DeclarationIndex): CoilHCell[] {
  if (!node.prompt) return [];
  const segs = segmentsFromTemplate(node.prompt, index);
  return segmentsNonEmpty(segs) ? [{ kind: 'template', segments: segs }] : [];
}

function buildThinkCells(node: ThinkNode, dialect: DialectTable, index: DeclarationIndex): CoilHCell[] {
  const cells: CoilHCell[] = [];

  // 1. Оснащение: ЧЕРЕЗ, КАК, ИСПОЛЬЗУЯ (I-0003)
  if (node.via) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Via'],
      value: refValue(valueRefToRef(node.via, index)),
    });
  }
  if (node.as.length > 0) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.As'],
      value: refsValue(node.as.map(a => valueRefToRef(a, index))),
    });
  }
  if (node.using.length > 0) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Using'],
      value: refsValue(node.using.map(t => toolRefToRef(t, index))),
    });
  }

  // 2. Постановка: ЦЕЛЬ, ВХОД, КОНТЕКСТ
  if (node.goal) {
    const segs = segmentsFromTemplate(node.goal, index);
    if (segmentsNonEmpty(segs)) {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.Goal'],
        value: tplValue(segs),
      });
    }
  }
  if (node.input) {
    const segs = segmentsFromTemplate(node.input, index);
    if (segmentsNonEmpty(segs)) {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.Input'],
        value: tplValue(segs),
      });
    }
  }
  if (node.context) {
    const segs = segmentsFromTemplate(node.context, index);
    if (segmentsNonEmpty(segs)) {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.Context'],
        value: tplValue(segs),
      });
    }
  }

  // 3. РЕЗУЛЬТАТ — самостоятельный structural block
  if (node.result.length > 0) {
    cells.push({
      kind: 'result-block',
      label: dialect.modifiers['Mod.Result'],
      fields: buildResultFields(node.result, dialect),
    });
  }

  // 4. Анонимное тело (D-0032)
  if (node.body) {
    const segs = segmentsFromTemplate(node.body, index);
    if (segmentsNonEmpty(segs)) cells.push({ kind: 'template', segments: segs });
  }

  return cells;
}

function buildExecuteCells(node: ExecuteNode, dialect: DialectTable, index: DeclarationIndex): CoilHCell[] {
  const cells: CoilHCell[] = [];
  cells.push({
    kind: 'modifier',
    label: dialect.modifiers['Mod.Using'],
    value: refValue(toolRefToRef(node.tool, index)),
  });
  if (node.args.length > 0) {
    cells.push({
      kind: 'args-block',
      args: node.args.map(a => ({ key: a.key, value: argValueToSegments(a.value, index) })),
    });
  }
  return cells;
}

function buildWaitCells(node: WaitNode, dialect: DialectTable, index: DeclarationIndex): CoilHCell[] {
  const cells: CoilHCell[] = [];
  cells.push({
    kind: 'modifier',
    label: dialect.modifiers['Mod.On'],
    value: refsValue(node.on.map(p => promiseRefToRef(p, index))),
  });
  if (node.mode) {
    const policyMap: Record<string, string> = {
      any: dialect.policies['Pol.Any'],
      all: dialect.policies['Pol.All'],
    };
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Mode'],
      value: plain(policyMap[node.mode] ?? node.mode),
    });
  }
  if (node.timeout) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Timeout'],
      value: plain(durationText(node.timeout, dialect)),
    });
  }
  return cells;
}

function extractDegradedBody(
  source: string,
  span: { offset: number; length: number },
  dialect: DialectTable,
): string {
  const raw = source.slice(span.offset, span.offset + span.length);
  const lines = raw.split('\n');
  lines.shift();
  const endKeyword = dialect.terminators['Kw.End'];
  if (lines.length > 0 && lines[lines.length - 1].trim() === endKeyword) {
    lines.pop();
  }
  return lines.join('\n').trim();
}

function exprToText(expr: ExpressionNode, source: string): string {
  return source.slice(expr.span.offset, expr.span.offset + expr.span.length);
}

function buildIfCells(node: IfNode, source: string): CoilHCell[] {
  return [{ kind: 'text', text: exprToText(node.condition, source) }];
}

function buildRepeatCells(node: RepeatNode, dialect: DialectTable, source: string): CoilHCell[] {
  const cells: CoilHCell[] = [];
  if (node.until) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Until'],
      value: plain(exprToText(node.until, source)),
    });
  }
  cells.push({
    kind: 'modifier',
    label: dialect.modifiers['Mod.Limit'],
    value: plain(String(node.limit)),
  });
  return cells;
}

function buildEachCells(node: EachNode, dialect: DialectTable, index: DeclarationIndex): CoilHCell[] {
  return [
    {
      kind: 'text',
      text: refToText(node.element.name, node.element.path),
    },
    {
      kind: 'modifier',
      label: dialect.modifiers['Mod.From'],
      value: refValue(valueRefToRef(node.from, index)),
    },
  ];
}

// ── AST walker ─────────────────────────────────────────────

function templateToFlatText(tpl: TemplateNode, index: DeclarationIndex): string {
  return segmentsToText(segmentsFromTemplate(tpl, index));
}

function bodyToCells(
  body: BodyValue,
  index: DeclarationIndex,
): { cells: CoilHCell[]; templates: string[] } {
  if (body.type === 'template') {
    const segs = segmentsFromTemplate(body, index);
    const flat = segmentsToText(segs);
    return { cells: [{ kind: 'template', segments: segs }], templates: [flat] };
  }
  return { cells: [{ kind: 'text', text: bodyValueToText(body) }], templates: [] };
}

function convertNodes(
  nodes: (OperatorNode | CommentNode)[],
  prefix: number[],
  rows: CoilHRow[],
  source: string,
  dialect: DialectTable,
  index: DeclarationIndex,
): void {
  let counter = 0;

  for (const node of nodes) {
    if (node.kind === 'Comment') {
      const prev = rows[rows.length - 1];
      if (prev && prev.mode === 'divider') {
        const firstCell = prev.cells[0];
        if (firstCell && firstCell.kind === 'text') {
          prev.cells = [{ kind: 'text', text: firstCell.text + '\n' + node.text }];
          continue;
        }
      }
      rows.push({
        step: null,
        operatorId: '',
        cells: [{ kind: 'text', text: node.text }],
        name: '',
        mode: 'divider',
        templates: [],
      });
      continue;
    }

    counter++;
    const step = [...prefix, counter];

    switch (node.kind) {
      case 'Op.Receive': {
        const templates: string[] = [];
        if (node.prompt) templates.push(templateToFlatText(node.prompt, index));
        rows.push({
          step,
          operatorId: 'Op.Receive',
          cells: buildReceiveCells(node, index),
          name: `$${node.name}`,
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.Send': {
        const templates: string[] = [];
        if (node.body) templates.push(templateToFlatText(node.body, index));
        rows.push({
          step,
          operatorId: 'Op.Send',
          cells: buildSendCells(node, dialect, index),
          name: node.name ? `$${node.name}` : '',
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.Exit': {
        rows.push({
          step,
          operatorId: 'Op.Exit',
          cells: [],
          name: '',
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Op.Actors': {
        rows.push({
          step,
          operatorId: 'Op.Actors',
          cells: [{ kind: 'text', text: node.names.join(', ') }],
          name: '',
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Op.Tools': {
        rows.push({
          step,
          operatorId: 'Op.Tools',
          cells: [{ kind: 'text', text: node.names.join(', ') }],
          name: '',
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Op.Define': {
        const { cells, templates } = bodyToCells(node.body, index);
        rows.push({
          step,
          operatorId: 'Op.Define',
          cells,
          name: `$${node.name}`,
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.Set': {
        const { cells, templates } = bodyToCells(node.body, index);
        rows.push({
          step,
          operatorId: 'Op.Set',
          cells,
          name: refToText(node.target.name, node.target.path),
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.Think': {
        const templates: string[] = [];
        if (node.goal) templates.push(templateToFlatText(node.goal, index));
        if (node.input) templates.push(templateToFlatText(node.input, index));
        if (node.context) templates.push(templateToFlatText(node.context, index));
        if (node.body) templates.push(templateToFlatText(node.body, index));
        rows.push({
          step,
          operatorId: 'Op.Think',
          cells: buildThinkCells(node, dialect, index),
          name: `$${node.name}`,
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.Execute': {
        rows.push({
          step,
          operatorId: 'Op.Execute',
          cells: buildExecuteCells(node, dialect, index),
          name: `$${node.name}`,
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Op.Wait': {
        rows.push({
          step,
          operatorId: 'Op.Wait',
          cells: buildWaitCells(node, dialect, index),
          name: node.name ? `$${node.name}` : '',
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Op.Signal': {
        const segs = segmentsFromTemplate(node.body, index);
        const templates: string[] = [];
        const cells: CoilHCell[] = [];
        if (segmentsNonEmpty(segs)) {
          templates.push(segmentsToText(segs));
          cells.push({ kind: 'template', segments: segs });
        }
        rows.push({
          step,
          operatorId: 'Op.Signal',
          cells,
          name: `~${node.target.name}`,
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.If': {
        rows.push({
          step,
          operatorId: 'Op.If',
          cells: buildIfCells(node, source),
          name: '',
          mode: 'full',
          templates: [],
        });
        convertNodes(node.body, step, rows, source, dialect, index);
        break;
      }
      case 'Op.Repeat': {
        rows.push({
          step,
          operatorId: 'Op.Repeat',
          cells: buildRepeatCells(node, dialect, source),
          name: '',
          mode: 'full',
          templates: [],
        });
        convertNodes(node.body, step, rows, source, dialect, index);
        break;
      }
      case 'Op.Each': {
        rows.push({
          step,
          operatorId: 'Op.Each',
          cells: buildEachCells(node, dialect, index),
          name: '',
          mode: 'full',
          templates: [],
        });
        convertNodes(node.body, step, rows, source, dialect, index);
        break;
      }
      case 'Unsupported': {
        rows.push({
          step,
          operatorId: node.operatorId,
          cells: [{ kind: 'text', text: extractDegradedBody(source, node.span, dialect) }],
          name: '',
          mode: 'degraded',
          templates: [],
        });
        break;
      }
    }
  }
}

export function astToCoilH(ast: ScriptNode, source: string, viewDialect: DialectTable): CoilHRow[] {
  const index = buildDeclarationIndex(ast.nodes);
  const rows: CoilHRow[] = [];
  convertNodes(ast.nodes, [], rows, source, viewDialect, index);
  return rows;
}
