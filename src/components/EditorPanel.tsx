import { useRef, useEffect } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from './ThemeProvider';
import { useExample } from './ExampleProvider';
import { DEFAULT_DIALECT } from '../coil/dialects';
import { ensureThemes, ensureLanguage, coilThemeName, languageId } from '../coil/languages';

export function EditorPanel() {
  const { resolvedTheme } = useTheme();
  const { activeExample } = useExample();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  function handleBeforeMount(monaco: Monaco) {
    ensureThemes(monaco);
    ensureLanguage(DEFAULT_DIALECT, monaco);
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    editor.setValue(activeExample.content);
    ensureLanguage(activeExample.dialect, monaco);
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageId(activeExample.dialect));
    }
  }, [activeExample]);

  return (
    <div className="flex-1 min-w-[400px] overflow-hidden">
      <Editor
        defaultValue={activeExample.content}
        defaultLanguage={`coil-${DEFAULT_DIALECT}`}
        theme={coilThemeName(resolvedTheme)}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
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
