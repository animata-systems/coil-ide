import { Fragment, type ReactNode, type MouseEvent } from 'react';
import type { DialectTable } from 'coil-runtime/browser';
import type { CoilHRow, CoilHCell, CoilHValue, CoilHSegment, CoilHRef, Sigil } from '../coil/coil-h';
import { renderSegmentsAsHtml } from '../utils/render-markdown';

export interface CoilHTableProps {
  rows: CoilHRow[];
  dialect: DialectTable;
  /**
   * Optional hook applied to each text-segment before rendering or Markdown
   * processing. Used by the playground for dialect-aware mock translations
   * (I-0007 / I-0014). Defaults to identity.
   */
  renderTextSegment?: (text: string) => string;
  /**
   * When true (default), template cells render as Markdown (headings, lists,
   * code, emphasis, links). Ref segments stay as clickable anchors. When
   * false, templates render as plain text + ref links via `SegmentView`.
   */
  markdownTemplates?: boolean;
}

// I-0012: smysl-suffix mapping for ref CSS classes
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

function stepId(step: number[]): string {
  return `step-${step.join('.')}`;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary">
      {children}
    </span>
  );
}

/**
 * Render a single typed reference. Resolved → anchor with smooth-scroll
 * navigation; unresolved (`targetStep===null`) → static `<span>` without
 * link affordance (I-0012).
 */
function RefLink({ ref }: { ref: CoilHRef }) {
  const sigilClass = SIGIL_CLASS[ref.sigil];
  const dynClass = ref.dynamic ? ' coil-h-ref--dynamic' : '';
  const text = refText(ref);

  if (ref.targetStep === null) {
    return (
      <span className={`coil-h-ref ${sigilClass}${dynClass} coil-h-ref--unresolved`}>
        {text}
      </span>
    );
  }

  const targetId = stepId(ref.targetStep);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks → let the browser open the anchor as usual.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = document.getElementById(targetId);
    if (!target) return; // fall back to default browser anchor jump
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    history.pushState({}, '', `#${targetId}`);
  };

  return (
    <a
      href={`#${targetId}`}
      className={`coil-h-ref ${sigilClass}${dynClass}`}
      onClick={onClick}
    >
      {text}
    </a>
  );
}

interface RenderCtx {
  renderTextSegment: (t: string) => string;
  markdownTemplates: boolean;
}

function SegmentView({ segments, ctx }: { segments: CoilHSegment[]; ctx: RenderCtx }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === 'text'
          ? <Fragment key={i}>{ctx.renderTextSegment(seg.text)}</Fragment>
          : <RefLink key={i} ref={seg.ref} />,
      )}
    </>
  );
}

function MarkdownTemplate({ segments, ctx, italic }: { segments: CoilHSegment[]; ctx: RenderCtx; italic?: boolean }) {
  const html = renderSegmentsAsHtml(segments, ctx.renderTextSegment);
  const classes = `coil-h-md block text-[12px] text-foreground/90 break-words${italic ? ' italic' : ''}`;
  // Click delegate for Markdown-rendered ref anchors. The plain-text
  // SegmentView attaches its own onClick to <RefLink>; here the anchors
  // come from `dangerouslySetInnerHTML` and need a delegated handler.
  const onClick = (e: MouseEvent<HTMLElement>) => {
    // Let the browser handle modified clicks (cmd+click → new tab,
    // shift+click → new window, middle-click → new tab).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[data-coil-h-ref="1"]') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const id = href.slice(1);
    const targetEl = document.getElementById(id);
    if (!targetEl) return;
    e.preventDefault();
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    history.pushState({}, '', href);
  };
  return (
    <span
      className={classes}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={onClick}
    />
  );
}

function TemplateBlock({ segments, ctx, italic }: { segments: CoilHSegment[]; ctx: RenderCtx; italic?: boolean }) {
  if (ctx.markdownTemplates) {
    return <MarkdownTemplate segments={segments} ctx={ctx} italic={italic} />;
  }
  return (
    <span className={`block font-mono text-[12px] text-foreground/90 whitespace-pre-wrap break-words${italic ? ' italic' : ''}`}>
      <SegmentView segments={segments} ctx={ctx} />
    </span>
  );
}

function ValueView({ value, ctx }: { value: CoilHValue; ctx: RenderCtx }) {
  if (value.kind === 'plain') {
    return <span className="font-mono text-[12px] text-foreground/90">{value.text}</span>;
  }
  if (value.kind === 'ref') {
    return (
      <span className="font-mono text-[12px] text-foreground/90">
        <RefLink ref={value.ref} />
      </span>
    );
  }
  if (value.kind === 'refs') {
    return (
      <span className="font-mono text-[12px] text-foreground/90">
        {value.refs.map((r, i) => (
          <Fragment key={i}>
            {i > 0 && ', '}
            <RefLink ref={r} />
          </Fragment>
        ))}
      </span>
    );
  }
  // Modifier templates render the same way as standalone template cells —
  // Markdown if enabled, plain segments otherwise.
  return <TemplateBlock segments={value.segments} ctx={ctx} italic />;
}

function ResultBlock({
  label,
  fields,
}: {
  label: string;
  fields: { name: string; type: string; description: string; depth: number }[];
}) {
  return (
    <div className="space-y-1">
      <Chip>{label}</Chip>
      <div className="ml-0 grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-0.5 text-[12px]">
        {fields.map((f, i) => (
          <Fragment key={i}>
            <span className="font-mono text-foreground/90" style={{ paddingLeft: `${f.depth * 12}px` }}>
              {f.name}
            </span>
            <span className="font-mono text-primary/80">{f.type}</span>
            <span className="text-muted-foreground">{f.description}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function ArgsBlock({ args, ctx }: { args: { key: string; value: CoilHSegment[] }[]; ctx: RenderCtx }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px] font-mono">
      {args.map((a, i) => (
        <Fragment key={i}>
          <span className="text-muted-foreground">{a.key}:</span>
          <span className="text-foreground/90 break-words">
            <SegmentView segments={a.value} ctx={ctx} />
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function CellView({ cell, ctx }: { cell: CoilHCell; ctx: RenderCtx }) {
  switch (cell.kind) {
    case 'modifier':
      return (
        <div className="flex flex-col gap-1">
          <Chip>{cell.label}</Chip>
          <div className="pl-0">
            <ValueView value={cell.value} ctx={ctx} />
          </div>
        </div>
      );
    case 'template':
      return <TemplateBlock segments={cell.segments} ctx={ctx} italic />;
    case 'result-block':
      return <ResultBlock label={cell.label} fields={cell.fields} />;
    case 'args-block':
      return <ArgsBlock args={cell.args} ctx={ctx} />;
    case 'text':
      return (
        <span className="text-[13px] text-foreground/90 whitespace-pre-wrap break-words">
          {cell.text}
        </span>
      );
  }
}

export function CoilHTable({ rows, dialect, renderTextSegment, markdownTemplates }: CoilHTableProps) {
  const ctx: RenderCtx = {
    renderTextSegment: renderTextSegment ?? ((t: string) => t),
    markdownTemplates: markdownTemplates ?? true,
  };

  return (
    <div className="min-w-[400px]">
      {/* Header */}
      <div className="sticky top-0 grid grid-cols-[32px_80px_1fr_80px] gap-3 px-4 py-2 bg-ide-panel text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>№</span>
        <span>Оператор</span>
        <span>Тело</span>
        <span>Имя</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-foreground/5">
        {rows.map((row, i) => {
          if (row.mode === 'divider') {
            const text = row.cells[0]?.kind === 'text' ? row.cells[0].text : '';
            return (
              <div
                key={i}
                className="px-4 py-2 text-xs text-muted-foreground italic whitespace-pre-wrap bg-foreground/3"
              >
                {text}
              </div>
            );
          }

          const operatorKeyword = row.operatorId && dialect.operators[row.operatorId as keyof typeof dialect.operators]
            ? dialect.operators[row.operatorId as keyof typeof dialect.operators]
            : row.operatorId;

          const isDegraded = row.mode === 'degraded';
          const id = row.step ? stepId(row.step) : undefined;

          return (
            <div
              key={i}
              id={id}
              className="grid grid-cols-[32px_80px_1fr_80px] gap-3 px-4 py-2.5 hover:bg-foreground/5 transition-colors"
            >
              <span className="text-xs text-muted-foreground pt-0.5">
                {row.step?.join('.')}
              </span>
              <span className="pt-0.5">
                {operatorKeyword && <Chip>{operatorKeyword}</Chip>}
              </span>
              <div className={`flex flex-col gap-2 min-w-0 ${isDegraded ? 'font-mono text-[11px] text-muted-foreground' : ''}`}>
                {isDegraded
                  ? (
                    <span className="whitespace-pre-wrap break-words">
                      {row.cells[0]?.kind === 'text' ? row.cells[0].text : ''}
                    </span>
                  )
                  : row.cells.map((cell, j) => (
                    <CellView key={j} cell={cell} ctx={ctx} />
                  ))
                }
              </div>
              <span className="font-mono text-xs text-muted-foreground truncate pt-0.5">
                {row.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
