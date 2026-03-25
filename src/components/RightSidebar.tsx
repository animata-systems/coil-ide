import { useState } from 'react';
import { usePipeline } from './PipelineProvider';

type Tab = 'validation' | 'coil-h';

function SeverityIcon({ severity }: { severity: 'error' | 'warning' }) {
  if (severity === 'error') {
    return <span className="text-red-500 shrink-0" aria-label="error">●</span>;
  }
  return <span className="text-yellow-500 shrink-0" aria-label="warning">●</span>;
}

function ValidationPanel() {
  const { diagnostics, revealDiagnostic } = usePipeline();

  if (diagnostics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Ошибок нет
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {diagnostics.map((d, i) => (
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
        {activeTab === 'validation' ? (
          <ValidationPanel />
        ) : (
          <div className="flex-1 p-4 overflow-y-auto text-sm text-gray-500 dark:text-gray-400">
            COIL-H table
          </div>
        )}
      </div>
    </aside>
  );
}
