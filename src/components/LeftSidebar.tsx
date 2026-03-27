import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { EXAMPLES, EXAMPLE_GROUPS, type ExampleGroup } from '../coil/examples';
import { useExample } from './ExampleProvider';

function ExampleFolder({ group }: { group: ExampleGroup }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { selectedFile, openExample, openExamples, setExample, setSelectedFile } = useExample();
  const items = EXAMPLES.filter(e => e.group === group);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-[13px] transition-colors hover:bg-foreground/5"
        style={{ paddingLeft: '8px' }}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-warning" />
        ) : (
          <Folder className="h-3.5 w-3.5 shrink-0 text-warning" />
        )}
        <span className="truncate text-foreground/80 font-semibold">{group}</span>
      </button>

      {isExpanded && (
        <div>
          {items.map(example => (
            <button
              key={example.id}
              onClick={() => {
                setSelectedFile(example.id);
                if (openExamples.includes(example.id)) {
                  setExample(example.id);
                }
              }}
              onDoubleClick={() => openExample(example.id)}
              className={`flex w-full items-center gap-1 rounded px-2 py-0.5 text-[13px] transition-colors ${
                selectedFile === example.id
                  ? 'bg-foreground/10 text-foreground'
                  : 'hover:bg-foreground/5'
              }`}
              style={{ paddingLeft: '22px' }}
            >
              <span className="w-3" />
              <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground/80">{example.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeftSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center px-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-2">
        {EXAMPLE_GROUPS.map(group => (
          <ExampleFolder key={group} group={group} />
        ))}
      </div>
    </div>
  );
}
