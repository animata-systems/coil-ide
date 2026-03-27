import { useRef, useEffect } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from './ThemeProvider';
import { useExample } from './ExampleProvider';
import { usePipeline } from './PipelineProvider';
import { DEFAULT_DIALECT } from '../coil/dialects';
import { ensureThemes, ensureLanguage, coilThemeName, languageId } from '../coil/languages';
import { spanToRange } from '../coil/monaco-utils';
import { EditorTabs } from './EditorTabs';
import { EmptyEditor } from './EmptyEditor';

export function EditorPanel() {
  const { resolvedTheme } = useTheme();
  const { activeExample, openExamples, setCursorPosition } = useExample();
  const { diagnostics, source, updateSource, registerEditor } = usePipeline();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  function handleBeforeMount(monaco: Monaco) {
    ensureThemes(monaco);
    ensureLanguage(DEFAULT_DIALECT, monaco);
  }

  const handleMount: OnMount = (ed, monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;
    registerEditor(ed);
    ed.onDidChangeCursorPosition(e => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });
  };

  // Switch example content and dialect
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco || !activeExample) return;

    ed.setValue(activeExample.content);
    ensureLanguage(activeExample.dialect, monaco);
    const model = ed.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageId(activeExample.dialect));
    }
  }, [activeExample]);

  // Update Monaco markers from diagnostics
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    const model = ed.getModel();
    if (!model) return;

    const markers = diagnostics.map(d => ({
      severity: d.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : d.severity === 'info'
          ? monaco.MarkerSeverity.Info
          : monaco.MarkerSeverity.Warning,
      message: d.message,
      ...spanToRange(d.span, source),
    }));
    monaco.editor.setModelMarkers(model, 'coil', markers);
  }, [diagnostics, source]);

  function handleChange(value: string | undefined) {
    if (value !== undefined) {
      updateSource(value);
    }
  }

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
        <Editor
          defaultValue={activeExample.content}
          defaultLanguage={`coil-${DEFAULT_DIALECT}`}
          theme={coilThemeName(resolvedTheme)}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            lineHeight: 24,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            tabSize: 2,
            folding: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 4,
            glyphMargin: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
}
