import { useRef, useEffect } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from './ThemeProvider';
import { useExample } from './ExampleProvider';
import { usePipeline } from './PipelineProvider';
import { DEFAULT_DIALECT } from '../coil/dialects';
import { ensureThemes, ensureLanguage, coilThemeName, languageId } from '../coil/languages';
import { spanToRange } from '../coil/monaco-utils';

export function EditorPanel() {
  const { resolvedTheme } = useTheme();
  const { activeExample } = useExample();
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
  };

  // Switch example content and dialect
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;

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

  return (
    <div className="flex-1 min-w-[400px] overflow-hidden">
      <Editor
        defaultValue={activeExample.content}
        defaultLanguage={`coil-${DEFAULT_DIALECT}`}
        theme={coilThemeName(resolvedTheme)}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
