import { EXAMPLES, EXAMPLE_GROUPS } from '../coil/examples';
import { useExample } from './ExampleProvider';

export function LeftSidebar() {
  const { activeExample, setExample } = useExample();

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
      {EXAMPLE_GROUPS.map(group => (
        <div key={group} className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 dark:text-gray-400">
            {group}
          </h2>
          <ul>
            {EXAMPLES.filter(e => e.group === group).map(example => (
              <li key={example.id}>
                <button
                  onClick={() => setExample(example.id)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                    activeExample.id === example.id
                      ? 'bg-blue-100 text-blue-800 font-medium dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {example.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
