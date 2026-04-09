import { X } from 'lucide-react';
import { useExample } from './ExampleProvider';

interface EditorTabProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

function EditorTab({ name, isActive, onClick, onClose }: EditorTabProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer transition-all rounded-md select-none max-w-[200px] shrink-0 ${
        isActive
          ? 'bg-foreground/10 text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
      }`}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      title={name}
    >
      <span className="font-medium truncate">{name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="rounded p-0.5 hover:bg-foreground/10 transition-colors opacity-60 hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function EditorTabs() {
  const { openExamples, activeExample, setExample, closeExample, allExamples } = useExample();

  if (openExamples.length === 0) {
    return (
      <div className="flex h-11 items-center gap-1 px-2 border-b border-border/30">
        <span className="text-xs text-muted-foreground px-2">Нет открытых файлов</span>
      </div>
    );
  }

  return (
    <div className="flex h-11 items-center gap-1 px-2 overflow-x-auto">
      {openExamples.map(id => {
        const example = allExamples.find(e => e.id === id);
        if (!example) return null;
        return (
          <EditorTab
            key={id}
            name={example.name}
            isActive={activeExample?.id === id}
            onClick={() => setExample(id)}
            onClose={() => closeExample(id)}
          />
        );
      })}
    </div>
  );
}
