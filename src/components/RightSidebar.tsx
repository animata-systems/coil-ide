import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { usePipeline } from './PipelineProvider';
import { useExample } from './ExampleProvider';
import { dialectRegistry } from '../coil/dialects';
import { astToCoilH, type CoilHRow } from '../coil/coil-h';
import { translateTemplate } from '../coil/template-translations';

// ── Validation Panel ────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

const severityConfig = {
  error: { icon: AlertCircle, className: 'text-error' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info: { icon: Info, className: 'text-info' },
} as const;

export function ValidationPanel() {
  const { diagnostics, revealDiagnostic } = usePipeline();

  const sorted = useMemo(() =>
    [...diagnostics].sort((a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
    ),
    [diagnostics],
  );

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between px-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Validation
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-error">
            <AlertCircle className="h-3.5 w-3.5" />
            {errorCount}
          </span>
          <span className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            {warningCount}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Ошибок нет
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="divide-y divide-foreground/5">
            {sorted.map((d, i) => {
              const config = severityConfig[d.severity] ?? severityConfig.info;
              const Icon = config.icon;
              return (
                <button
                  key={i}
                  onClick={() => revealDiagnostic(d)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-foreground/5 transition-colors"
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.className}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90 leading-snug">{d.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Строка {d.span.line}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COIL-H Panel ────────────────────────────────────────

function translateBody(row: CoilHRow, exampleId: string, dialectName: string): string {
  if (row.mode !== 'full' || row.templates.length === 0) return row.body;

  let body = row.body;
  for (const original of row.templates) {
    const translated = translateTemplate(exampleId, original, dialectName);
    if (translated !== original) {
      body = body.replace(`<< ${original} >>`, `<< ${translated} >>`);
    }
  }
  return body;
}

export function CoilHPanel() {
  const { ast, source, parseError } = usePipeline();
  const { activeExample } = useExample();
  const [coilHDialect, setCoilHDialect] = useState<string>(activeExample.dialect);

  useEffect(() => {
    setCoilHDialect(activeExample.dialect);
  }, [activeExample]);

  const viewDialect = dialectRegistry.get(coilHDialect);

  const rows = useMemo(() => {
    if (!ast || !viewDialect) return null;
    return astToCoilH(ast, source, viewDialect);
  }, [ast, source, viewDialect]);

  if (parseError) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-11 items-center px-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            COIL-H
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-sm text-error text-center">
            <p className="font-medium">Ошибка парсинга</p>
            <p className="mt-1 text-muted-foreground">{parseError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!rows || !viewDialect) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-11 items-center px-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            COIL-H
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Нет данных
        </div>
      </div>
    );
  }

  const dialectEntries = Array.from(dialectRegistry.entries());

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center px-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          COIL-H
        </span>
      </div>

      <div className="shrink-0 px-4 py-2 border-b border-foreground/5">
        <select
          value={coilHDialect}
          onChange={e => setCoilHDialect(e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-input text-foreground"
        >
          {dialectEntries.map(([name, d]) => (
            <option key={name} value={name}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
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
                return (
                  <div
                    key={i}
                    className="px-4 py-2 text-xs text-muted-foreground italic whitespace-pre-wrap bg-foreground/3"
                  >
                    {row.body}
                  </div>
                );
              }

              const operatorKeyword = row.operatorId && viewDialect.operators[row.operatorId as keyof typeof viewDialect.operators]
                ? viewDialect.operators[row.operatorId as keyof typeof viewDialect.operators]
                : row.operatorId;

              const translatedBody = translateBody(row, activeExample!.id, coilHDialect);
              const isDegraded = row.mode === 'degraded';

              return (
                <div
                  key={i}
                  className="grid grid-cols-[32px_80px_1fr_80px] gap-3 px-4 py-2.5 text-sm hover:bg-foreground/5 transition-colors"
                >
                  <span className="text-xs text-muted-foreground">
                    {row.step?.join('.')}
                  </span>
                  <span>
                    {operatorKeyword && (
                      <span className="inline-block rounded-md px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary">
                        {operatorKeyword}
                      </span>
                    )}
                  </span>
                  <span className={`text-foreground/90 whitespace-pre-wrap break-words ${isDegraded ? 'font-mono text-[11px] text-muted-foreground' : ''}`}>
                    {translatedBody}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {row.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
