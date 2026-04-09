import { AlertCircle, AlertTriangle, Check } from 'lucide-react';
import { usePipeline } from 'coil-ide';
import { useExample } from './ExampleProvider';

export function StatusBar() {
  const { diagnostics } = usePipeline();
  const { activeExample, cursorPosition } = useExample();

  const errors = diagnostics.filter(d => d.severity === 'error').length;
  const warnings = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div className="flex h-6 items-center justify-between bg-ide-panel/80 backdrop-blur-sm px-3 text-xs text-muted-foreground border-t border-border/20 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Problems */}
        <div className="flex items-center gap-2">
          {errors > 0 && (
            <div className="flex items-center gap-1 text-error">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errors}</span>
            </div>
          )}
          {warnings > 0 && (
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{warnings}</span>
            </div>
          )}
          {errors === 0 && warnings === 0 && (
            <div className="flex items-center gap-1 text-success">
              <Check className="h-3.5 w-3.5" />
              <span>No problems</span>
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {activeExample && (
          <>
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <span>Spaces: 2</span>
            <span>Coil</span>
          </>
        )}
        <span className="text-muted-foreground/60">v0.3.0</span>
      </div>
    </div>
  );
}
