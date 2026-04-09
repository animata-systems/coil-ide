import { Fragment, type ReactNode } from 'react';
import type { DialectTable } from 'coil-runtime/browser';
import type { CoilHRow, CoilHCell, CoilHValue } from '../coil/coil-h';

export interface CoilHTableProps {
  rows: CoilHRow[];
  dialect: DialectTable;
  /**
   * Optional hook to transform a template text before it is rendered.
   * Used by the playground to apply dialect-aware mock translations.
   * Defaults to identity.
   */
  renderTemplate?: (text: string) => string;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary">
      {children}
    </span>
  );
}

function TemplateBlock({ text, renderTemplate }: { text: string; renderTemplate: (t: string) => string }) {
  return (
    <span className="block font-mono text-[12px] text-foreground/90 italic whitespace-pre-wrap break-words">
      {renderTemplate(text)}
    </span>
  );
}

function ValueView({ value, renderTemplate }: { value: CoilHValue; renderTemplate: (t: string) => string }) {
  if (value.kind === 'plain') {
    return <span className="font-mono text-[12px] text-foreground/90">{value.text}</span>;
  }
  return <TemplateBlock text={value.text} renderTemplate={renderTemplate} />;
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

function ArgsBlock({ args }: { args: { key: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px] font-mono">
      {args.map((a, i) => (
        <Fragment key={i}>
          <span className="text-muted-foreground">{a.key}:</span>
          <span className="text-foreground/90 break-words">{a.value}</span>
        </Fragment>
      ))}
    </div>
  );
}

function CellView({ cell, renderTemplate }: { cell: CoilHCell; renderTemplate: (t: string) => string }) {
  switch (cell.kind) {
    case 'modifier':
      return (
        <div className="flex flex-col gap-1">
          <Chip>{cell.label}</Chip>
          <div className="pl-0">
            <ValueView value={cell.value} renderTemplate={renderTemplate} />
          </div>
        </div>
      );
    case 'template':
      return <TemplateBlock text={cell.text} renderTemplate={renderTemplate} />;
    case 'result-block':
      return <ResultBlock label={cell.label} fields={cell.fields} />;
    case 'args-block':
      return <ArgsBlock args={cell.args} />;
    case 'text':
      return (
        <span className="text-[13px] text-foreground/90 whitespace-pre-wrap break-words">
          {cell.text}
        </span>
      );
  }
}

export function CoilHTable({ rows, dialect, renderTemplate }: CoilHTableProps) {
  const rt = renderTemplate ?? ((t: string) => t);

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

          return (
            <div
              key={i}
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
                    <CellView key={j} cell={cell} renderTemplate={rt} />
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
