import { useRef, useEffect } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { ValidationDiagnostic } from 'coil-runtime/browser';
import { ensureThemes, ensureLanguage, coilThemeName, languageId } from '../coil/languages';
import { spanToRange } from '../coil/monaco-utils';

export interface EditorViewProps {
  /** Current editor contents (controlled). */
  value: string;
  /** Called when the user edits the text. Omit for read-only usage. */
  onChange?: (value: string) => void;
  /** Disables editing. */
  readOnly?: boolean;
  /** Dialect key (e.g. 'ru-standard'). Used for Monaco language registration. */
  dialect: string;
  /** Visual theme. */
  theme: 'light' | 'dark';
  /** Diagnostics to render as Monaco markers. */
  diagnostics?: ValidationDiagnostic[];
  /** Called after Monaco mounts the editor instance. */
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
  /** Called when the cursor position changes. */
  onCursorPositionChange?: (position: { line: number; column: number }) => void;
}

/**
 * Controlled Monaco-based COIL editor. Library-level component with no
 * dependency on playground contexts (theme/example/pipeline providers).
 */
export function EditorView({
  value,
  onChange,
  readOnly = false,
  dialect,
  theme,
  diagnostics,
  onMount,
  onCursorPositionChange,
}: EditorViewProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  function handleBeforeMount(monaco: Monaco) {
    ensureThemes(monaco);
    ensureLanguage(dialect, monaco);
  }

  const handleMount: OnMount = (ed, monaco) => {
    editorRef.current = ed;
    monacoRef.current = monaco;
    if (onCursorPositionChange) {
      ed.onDidChangeCursorPosition(e => {
        onCursorPositionChange({ line: e.position.lineNumber, column: e.position.column });
      });
    }
    onMount?.(ed, monaco);
  };

  // Controlled value: sync external changes into Monaco without resetting
  // cursor/scroll when the user is the one typing.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (ed.getValue() === value) return;
    ed.setValue(value);
  }, [value]);

  // Switch Monaco language when dialect changes.
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    ensureLanguage(dialect, monaco);
    const model = ed.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageId(dialect));
    }
  }, [dialect]);

  // Render diagnostics as Monaco markers.
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    const model = ed.getModel();
    if (!model) return;

    const markers = (diagnostics ?? []).map(d => ({
      severity: d.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : d.severity === 'info'
          ? monaco.MarkerSeverity.Info
          : monaco.MarkerSeverity.Warning,
      message: d.message,
      ...spanToRange(d.span, value),
    }));
    monaco.editor.setModelMarkers(model, 'coil', markers);
  }, [diagnostics, value]);

  function handleChange(next: string | undefined) {
    if (next === undefined) return;
    onChange?.(next);
  }

  return (
    <Editor
      defaultValue={value}
      defaultLanguage={languageId(dialect)}
      theme={coilThemeName(theme)}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={handleChange}
      options={{
        readOnly,
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
  );
}
