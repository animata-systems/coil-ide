import { useTheme } from './ThemeProvider';
import { useExample } from './ExampleProvider';
import { usePipeline, EditorView } from 'coil-ide';
import { EditorTabs } from './EditorTabs';
import { EmptyEditor } from './EmptyEditor';

/**
 * Playground-level editor panel: composes EditorTabs with the library
 * EditorView, wiring in theme/example/pipeline contexts.
 */
export function EditorPanel() {
  const { resolvedTheme } = useTheme();
  const { activeExample, openExamples, setCursorPosition } = useExample();
  const { source, diagnostics, updateSource, registerEditor } = usePipeline();

  if (openExamples.length === 0 || !activeExample) {
    return (
      <div className="flex h-full flex-col">
        <EditorTabs />
        <EmptyEditor />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <EditorTabs />
      <div className="flex-1 min-h-0">
        <EditorView
          value={source}
          onChange={updateSource}
          dialect={activeExample.dialect}
          theme={resolvedTheme}
          diagnostics={diagnostics}
          onMount={ed => registerEditor(ed)}
          onCursorPositionChange={pos => setCursorPosition(pos)}
        />
      </div>
    </div>
  );
}
