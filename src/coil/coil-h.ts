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
} from 'coil-runtime/browser';

// ── Structural cells (I-0005) ──────────────────────────────
//
// `CoilHRow.cells` replaces the previous `body: string`. Physical
// template markers `<<>>` and modifier/value separation live in the
// renderer, not in the data. Templates always carry the trimmed
// plain-text form without `<<`/`>>`.

export type CoilHValue =
  | { kind: 'plain'; text: string }
  | { kind: 'template'; text: string };

export interface ResultFieldRow {
  name: string;
  type: string;
  description: string;
  depth: number;
}

export type CoilHCell =
  | { kind: 'modifier'; label: string; value: CoilHValue }
  | { kind: 'template'; text: string }
  | { kind: 'result-block'; label: string; fields: ResultFieldRow[] }
  | { kind: 'args-block'; args: { key: string; value: string }[] }
  | { kind: 'text'; text: string };

export interface CoilHRow {
  step: number[] | null;
  operatorId: string;
  cells: CoilHCell[];
  name: string;
  mode: 'full' | 'degraded' | 'divider';
  /** Original template texts for translation matching (full mode only) */
  templates: string[];
}

// ── Helpers ────────────────────────────────────────────────

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
  }
}

function channelRefToText(ref: SendNode['to']): string {
  if (!ref) return '';
  return '#' + ref.segments.map(s =>
    s.kind === 'literal' ? s.value : `$${s.name}`,
  ).join('/');
}

function plain(text: string): CoilHValue {
  return { kind: 'plain', text };
}

function tplValue(text: string): CoilHValue {
  return { kind: 'template', text };
}

function durationText(
  timeout: { value: number; unitId: string },
  dialect: DialectTable,
): string {
  const suffix = (dialect.durationSuffixes as Record<string, string>)[timeout.unitId] ?? '';
  return `${timeout.value}${suffix}`;
}

function argValueToText(value: ArgEntry['value']): string {
  switch (value.type) {
    case 'ref':
      return refToText(value.name, value.path);
    case 'string':
      return value.value;
    case 'number':
      return String(value.value);
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

// ── Per-operator cell builders ─────────────────────────────

function buildSendCells(node: SendNode, dialect: DialectTable): CoilHCell[] {
  const cells: CoilHCell[] = [];

  if (node.to) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.To'],
      value: plain(channelRefToText(node.to)),
    });
  }
  if (node.for.length > 0) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.For'],
      value: plain(node.for.map(n => `@${n}`).join(', ')),
    });
  }
  if (node.replyTo) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.ReplyTo'],
      value: plain(channelRefToText(node.replyTo)),
    });
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
    const text = templateToText(node.body).trim();
    if (text) cells.push({ kind: 'template', text });
  }

  return cells;
}

function buildReceiveCells(node: ReceiveNode): CoilHCell[] {
  if (!node.prompt) return [];
  const text = templateToText(node.prompt).trim();
  return text ? [{ kind: 'template', text }] : [];
}

function buildThinkCells(node: ThinkNode, dialect: DialectTable): CoilHCell[] {
  const cells: CoilHCell[] = [];

  // 1. Оснащение: ЧЕРЕЗ, КАК, ИСПОЛЬЗУЯ (I-0003)
  if (node.via) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Via'],
      value: plain(refToText(node.via.name, node.via.path)),
    });
  }
  if (node.as.length > 0) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.As'],
      value: plain(node.as.map(a => refToText(a.name, a.path)).join(', ')),
    });
  }
  if (node.using.length > 0) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Using'],
      value: plain(node.using.map(t => `!${t.name}`).join(', ')),
    });
  }

  // 2. Постановка: ЦЕЛЬ, ВХОД, КОНТЕКСТ — модификаторы с template-значением
  if (node.goal) {
    const text = templateToText(node.goal).trim();
    if (text) {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.Goal'],
        value: tplValue(text),
      });
    }
  }
  if (node.input) {
    const text = templateToText(node.input).trim();
    if (text) {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.Input'],
        value: tplValue(text),
      });
    }
  }
  if (node.context) {
    const text = templateToText(node.context).trim();
    if (text) {
      cells.push({
        kind: 'modifier',
        label: dialect.modifiers['Mod.Context'],
        value: tplValue(text),
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

  // 4. Анонимное тело (D-0032) — template-ячейка
  if (node.body) {
    const text = templateToText(node.body).trim();
    if (text) cells.push({ kind: 'template', text });
  }

  return cells;
}

function buildExecuteCells(node: ExecuteNode, dialect: DialectTable): CoilHCell[] {
  const cells: CoilHCell[] = [];
  cells.push({
    kind: 'modifier',
    label: dialect.modifiers['Mod.Using'],
    value: plain(`!${node.tool.name}`),
  });
  if (node.args.length > 0) {
    cells.push({
      kind: 'args-block',
      args: node.args.map(a => ({ key: a.key, value: argValueToText(a.value) })),
    });
  }
  return cells;
}

function buildWaitCells(node: WaitNode, dialect: DialectTable): CoilHCell[] {
  const cells: CoilHCell[] = [];
  cells.push({
    kind: 'modifier',
    label: dialect.modifiers['Mod.On'],
    value: plain(node.on.map(p => `?${p.name}`).join(', ')),
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

function buildIfCells(node: IfNode): CoilHCell[] {
  return [{ kind: 'text', text: node.condition }];
}

function buildRepeatCells(node: RepeatNode, dialect: DialectTable): CoilHCell[] {
  const cells: CoilHCell[] = [];
  if (node.until) {
    cells.push({
      kind: 'modifier',
      label: dialect.modifiers['Mod.Until'],
      value: plain(node.until),
    });
  }
  cells.push({
    kind: 'modifier',
    label: dialect.modifiers['Mod.Limit'],
    value: plain(String(node.limit)),
  });
  return cells;
}

function buildEachCells(node: EachNode, dialect: DialectTable): CoilHCell[] {
  return [
    {
      kind: 'text',
      text: refToText(node.element.name, node.element.path),
    },
    {
      kind: 'modifier',
      label: dialect.modifiers['Mod.From'],
      value: plain(refToText(node.from.name, node.from.path)),
    },
  ];
}

// ── AST walker ─────────────────────────────────────────────

function convertNodes(
  nodes: (OperatorNode | CommentNode)[],
  prefix: number[],
  rows: CoilHRow[],
  source: string,
  dialect: DialectTable,
): void {
  let counter = 0;

  for (const node of nodes) {
    if (node.kind === 'Comment') {
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
        if (node.prompt) templates.push(templateToText(node.prompt).trim());
        rows.push({
          step,
          operatorId: 'Op.Receive',
          cells: buildReceiveCells(node),
          name: node.name,
          mode: 'full',
          templates,
        });
        break;
      }
      case 'Op.Send': {
        const templates: string[] = [];
        if (node.body) templates.push(templateToText(node.body).trim());
        rows.push({
          step,
          operatorId: 'Op.Send',
          cells: buildSendCells(node, dialect),
          name: node.name ?? '',
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
        const templates: string[] = [];
        const cells: CoilHCell[] = [];
        if (node.body.type === 'template') {
          const text = templateToText(node.body).trim();
          templates.push(text);
          cells.push({ kind: 'template', text });
        } else {
          cells.push({ kind: 'text', text: bodyValueToText(node.body) });
        }
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
        const templates: string[] = [];
        const cells: CoilHCell[] = [];
        if (node.body.type === 'template') {
          const text = templateToText(node.body).trim();
          templates.push(text);
          cells.push({ kind: 'template', text });
        } else {
          cells.push({ kind: 'text', text: bodyValueToText(node.body) });
        }
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
        if (node.goal) templates.push(templateToText(node.goal).trim());
        if (node.input) templates.push(templateToText(node.input).trim());
        if (node.context) templates.push(templateToText(node.context).trim());
        if (node.body) templates.push(templateToText(node.body).trim());
        rows.push({
          step,
          operatorId: 'Op.Think',
          cells: buildThinkCells(node, dialect),
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
          cells: buildExecuteCells(node, dialect),
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
          cells: buildWaitCells(node, dialect),
          name: '',
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Op.Signal': {
        const bodyText = templateToText(node.body).trim();
        const templates: string[] = [];
        const cells: CoilHCell[] = [];
        if (bodyText) {
          templates.push(bodyText);
          cells.push({ kind: 'template', text: bodyText });
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
          cells: buildIfCells(node),
          name: '',
          mode: 'full',
          templates: [],
        });
        convertNodes(node.body, step, rows, source, dialect);
        break;
      }
      case 'Op.Repeat': {
        rows.push({
          step,
          operatorId: 'Op.Repeat',
          cells: buildRepeatCells(node, dialect),
          name: '',
          mode: 'full',
          templates: [],
        });
        convertNodes(node.body, step, rows, source, dialect);
        break;
      }
      case 'Op.Each': {
        rows.push({
          step,
          operatorId: 'Op.Each',
          cells: buildEachCells(node, dialect),
          name: '',
          mode: 'full',
          templates: [],
        });
        convertNodes(node.body, step, rows, source, dialect);
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
  const rows: CoilHRow[] = [];
  convertNodes(ast.nodes, [], rows, source, viewDialect);
  return rows;
}
