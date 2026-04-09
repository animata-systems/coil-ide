import { Files } from 'lucide-react';

interface LeftToolbarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function LeftToolbar({ isOpen, onToggle }: LeftToolbarProps) {
  return (
    <div className="flex w-11 flex-col items-center bg-transparent py-2">
      <button
        onClick={onToggle}
        title="Files"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150 ${
          isOpen
            ? 'bg-foreground/10 text-foreground shadow-sm'
            : 'text-foreground/50 hover:text-foreground hover:bg-foreground/8'
        }`}
      >
        <Files className="h-4 w-4" />
      </button>
    </div>
  );
}
