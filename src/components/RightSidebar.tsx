import { useState } from 'react';

type Tab = 'validation' | 'coil-h';

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
      <div className="flex-1 p-4 overflow-y-auto text-sm text-gray-500 dark:text-gray-400">
        {activeTab === 'validation' ? 'No diagnostics' : 'COIL-H table'}
      </div>
    </aside>
  );
}
