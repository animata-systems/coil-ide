import type {
  ScriptNode,
  TemplateNode,
  SendNode,
  ReceiveNode,
  DialectTable,
} from 'coil-runtime/browser';

export interface CoilHRow {
  step: number | null;
  operatorId: string;
  body: string;
  name: string;
  mode: 'full' | 'degraded' | 'divider';
  /** Original template texts for translation matching (full mode only) */
  templates: string[];
}

export function templateToText(tpl: TemplateNode): string {
  return tpl.parts.map(p =>
    p.type === 'text' ? p.value : `$${p.name}${p.path.length ? '.' + p.path.join('.') : ''}`,
  ).join('');
}

function buildSendBody(node: SendNode, dialect: DialectTable): string {
  const parts: string[] = [];

  if (node.to) {
    const channelText = node.to.segments.map(s =>
      s.kind === 'literal' ? s.value : `$${s.name}`,
    ).join('/');
    parts.push(`${dialect.modifiers['Mod.To']} #${channelText}`);
  }
  if (node.for.length > 0) {
    parts.push(`${dialect.modifiers['Mod.For']} ${node.for.map(n => `@${n}`).join(', ')}`);
  }
  if (node.replyTo) {
    const replyText = node.replyTo.segments.map(s =>
      s.kind === 'literal' ? s.value : `$${s.name}`,
    ).join('/');
    parts.push(`${dialect.modifiers['Mod.ReplyTo']} #${replyText}`);
  }
  if (node.await) {
    const policyMap: Record<string, string> = {
      none: dialect.policies['Pol.None'],
      any: dialect.policies['Pol.Any'],
      all: dialect.policies['Pol.All'],
    };
    parts.push(`${dialect.modifiers['Mod.Await']} ${policyMap[node.await] ?? node.await}`);
  }
  if (node.timeout) {
    const suffix = Object.values(dialect.durationSuffixes).find((_, i) =>
      Object.keys(dialect.durationSuffixes)[i] === node.timeout!.unitId,
    ) ?? '';
    parts.push(`${dialect.modifiers['Mod.Timeout']} ${node.timeout.value}${suffix}`);
  }

  if (node.body) {
    const text = templateToText(node.body).trim();
    if (text) parts.push(`<< ${text} >>`);
  }

  return parts.join('\n');
}

function buildReceiveBody(node: ReceiveNode): string {
  if (!node.prompt) return '';
  const text = templateToText(node.prompt).trim();
  return text ? `<< ${text} >>` : '';
}

function extractDegradedBody(source: string, span: { offset: number; length: number }, dialect: DialectTable): string {
  const raw = source.slice(span.offset, span.offset + span.length);
  const lines = raw.split('\n');

  // Remove first line (operator keyword)
  lines.shift();

  // Remove last line if it's END
  const endKeyword = dialect.terminators['Kw.End'];
  if (lines.length > 0 && lines[lines.length - 1].trim() === endKeyword) {
    lines.pop();
  }

  return lines.join('\n').trim();
}

export function astToCoilH(ast: ScriptNode, source: string, viewDialect: DialectTable): CoilHRow[] {
  const rows: CoilHRow[] = [];
  let step = 0;

  for (const node of ast.nodes) {
    if (node.kind === 'Comment') {
      const prev = rows[rows.length - 1];
      if (prev && prev.mode === 'divider') {
        prev.body += '\n' + node.text;
      } else {
        rows.push({
          step: null,
          operatorId: '',
          body: node.text,
          name: '',
          mode: 'divider',
          templates: [],
        });
      }
      continue;
    }

    step++;

    switch (node.kind) {
      case 'Op.Receive': {
        const templates: string[] = [];
        if (node.prompt) templates.push(templateToText(node.prompt).trim());
        rows.push({
          step,
          operatorId: 'Op.Receive',
          body: buildReceiveBody(node),
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
          body: buildSendBody(node, viewDialect),
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
          body: '',
          name: '',
          mode: 'full',
          templates: [],
        });
        break;
      }
      case 'Unsupported': {
        rows.push({
          step,
          operatorId: node.operatorId,
          body: extractDegradedBody(source, node.span, viewDialect),
          name: '',
          mode: 'degraded',
          templates: [],
        });
        break;
      }
    }
  }

  return rows;
}
