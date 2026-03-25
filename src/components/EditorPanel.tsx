import Editor, { type Monaco } from '@monaco-editor/react';
import { useTheme } from './ThemeProvider';
import { DEFAULT_DIALECT } from '../coil/dialects';
import { ensureThemes, ensureLanguage, coilThemeName } from '../coil/languages';

const SAMPLE = `' Hello World — COIL Playground
RECEIVE name
<<
What is your name?
>>
END

SEND
<<
Hello, $name!
>>
END

EXIT`;

export function EditorPanel() {
  const { resolvedTheme } = useTheme();

  function handleBeforeMount(monaco: Monaco) {
    ensureThemes(monaco);
    ensureLanguage(DEFAULT_DIALECT, monaco);
  }

  return (
    <div className="flex-1 min-w-[400px] overflow-hidden">
      <Editor
        defaultValue={SAMPLE}
        defaultLanguage={`coil-${DEFAULT_DIALECT}`}
        theme={coilThemeName(resolvedTheme)}
        beforeMount={handleBeforeMount}
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
