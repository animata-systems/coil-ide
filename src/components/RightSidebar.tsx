import { useState, useEffect, useMemo } from 'react';
import { usePipeline } from './PipelineProvider';
import { useExample } from './ExampleProvider';
import { dialectRegistry } from '../coil/dialects';
import { astToCoilH, type CoilHRow } from '../coil/coil-h';
import { translateTemplate } from '../coil/template-translations';

type Tab = 'validation' | 'coil-h';

// ── Validation Panel ────────────────────────────────────

function SeverityIcon({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  if (severity === 'error') {
    return <span className="text-red-500 shrink-0" aria-label="error">●</span>;
  }
  if (severity === 'info') {
    return <span className="text-blue-500 shrink-0" aria-label="info">●</span>;
  }
  return <span className="text-yellow-500 shrink-0" aria-label="warning">●</span>;
}

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

function ValidationPanel() {
  const { diagnostics, revealDiagnostic } = usePipeline();

  const sorted = useMemo(() =>
    [...diagnostics].sort((a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
    ),
    [diagnostics],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Ошибок нет
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {sorted.map((d, i) => (
          <li
            key={i}
            onClick={() => revealDiagnostic(d)}
            className="flex items-start gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <SeverityIcon severity={d.severity} />
            <div className="min-w-0">
              <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                {d.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Строка {d.span.line}
              </p>
            </div>
          </li>
        ))}
      </ul>
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

function CoilHPanel() {
  const { ast, source, parseError } = usePipeline();
  const { activeExample } = useExample();
  const [coilHDialect, setCoilHDialect] = useState<string>(activeExample.dialect);

  // Reset COIL-H dialect when example changes
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-sm text-red-500 dark:text-red-400 text-center">
          <p className="font-medium">Ошибка парсинга</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{parseError}</p>
        </div>
      </div>
    );
  }

  if (!rows || !viewDialect) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Нет данных
      </div>
    );
  }

  const dialectEntries = Array.from(dialectRegistry.entries());

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Dialect dropdown */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <select
          value={coilHDialect}
          onChange={e => setCoilHDialect(e.target.value)}
          className="w-full text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          {dialectEntries.map(([name, d]) => (
            <option key={name} value={name}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-2 py-1.5 text-left w-8">№</th>
              <th className="px-2 py-1.5 text-left w-24">Оператор</th>
              <th className="px-2 py-1.5 text-left">Тело</th>
              <th className="px-2 py-1.5 text-left w-24">Имя</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, i) => {
              if (row.mode === 'divider') {
                return (
                  <tr key={i} className="bg-gray-50 dark:bg-gray-800/50">
                    <td
                      colSpan={4}
                      className="px-2 py-1.5 text-gray-500 dark:text-gray-400 italic whitespace-pre-wrap"
                    >
                      {row.body}
                    </td>
                  </tr>
                );
              }

              const operatorKeyword = row.operatorId && viewDialect.operators[row.operatorId as keyof typeof viewDialect.operators]
                ? viewDialect.operators[row.operatorId as keyof typeof viewDialect.operators]
                : row.operatorId;

              const translatedBody = translateBody(row, activeExample.id, coilHDialect);
              const isDegraded = row.mode === 'degraded';

              return (
                <tr
                  key={i}
                  className={isDegraded ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}
                >
                  <td className="px-2 py-1.5 align-top text-gray-400 dark:text-gray-500">
                    {row.step?.join('.')}
                  </td>
                  <td className="px-2 py-1.5 align-top font-medium">
                    {operatorKeyword}
                  </td>
                  <td className={`px-2 py-1.5 align-top whitespace-pre-wrap break-words ${isDegraded ? 'font-mono text-[11px]' : ''}`}>
                    {translatedBody}
                  </td>
                  <td className="px-2 py-1.5 align-top font-mono text-gray-600 dark:text-gray-400">
                    {row.name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Right Sidebar ───────────────────────────────────────

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('validation');

  return (
    <aside className="w-[360px] shrink-0 border-l border-gray-200 bg-white flex flex-col dark:border-gray-700 dark:bg-gray-900">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'validation'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Validation
        </button>
        <button
          onClick={() => setActiveTab('coil-h')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'coil-h'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          COIL-H
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'validation' ? <ValidationPanel /> : <CoilHPanel />}
      </div>
    </aside>
  );
}
