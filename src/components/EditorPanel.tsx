import Editor from '@monaco-editor/react';
import { useTheme } from './ThemeProvider';

export function EditorPanel() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex-1 min-w-0">
      <Editor
        defaultValue="' Write your COIL script here"
        language="plaintext"
        theme={resolvedTheme === 'light' ? 'vs' : 'vs-dark'}
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
