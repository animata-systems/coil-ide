import { AlertCircle, Table2 } from 'lucide-react';

export type RightPanelView = 'validation' | 'coil-h';

interface RightToolbarProps {
  activeView: RightPanelView;
  isPanelOpen: boolean;
  onToggle: (view: RightPanelView) => void;
}

export function RightToolbar({ activeView, isPanelOpen, onToggle }: RightToolbarProps) {
  const isActive = (view: RightPanelView) => isPanelOpen && activeView === view;

  const btnClass = (view: RightPanelView) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150 ${
      isActive(view)
        ? 'bg-foreground/10 text-foreground shadow-sm'
        : 'text-foreground/50 hover:text-foreground hover:bg-foreground/8'
    }`;

  return (
    <div className="flex w-11 flex-col items-center gap-1 bg-transparent py-2">
      <button
        onClick={() => onToggle('validation')}
        title="Validation"
        className={btnClass('validation')}
      >
        <AlertCircle className="h-4 w-4" />
      </button>
      <button
        onClick={() => onToggle('coil-h')}
        title="COIL-H"
        className={btnClass('coil-h')}
      >
        <Table2 className="h-4 w-4" />
      </button>
    </div>
  );
}
