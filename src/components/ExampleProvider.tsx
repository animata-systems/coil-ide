import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { EXAMPLES, type Example } from '../coil/examples';

export interface CursorPosition {
  line: number;
  column: number;
}

interface ExampleContextValue {
  activeExample: Example | null;
  openExamples: string[];
  selectedFile: string | null;
  cursorPosition: CursorPosition;
  allExamples: Example[];
  setExample: (id: string) => void;
  openExample: (id: string) => void;
  closeExample: (id: string) => void;
  setSelectedFile: (id: string | null) => void;
  setCursorPosition: (pos: CursorPosition) => void;
  createFile: (name: string, dialect: string) => void;
}

const ExampleContext = createContext<ExampleContextValue | null>(null);

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [activeExample, setActiveExample] = useState<Example>(EXAMPLES[0]);
  const [openExamples, setOpenExamples] = useState<string[]>([EXAMPLES[0].id]);
  const [selectedFile, setSelectedFile] = useState<string | null>(EXAMPLES[0].id);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
  const [userFiles, setUserFiles] = useState<Example[]>([]);

  const allExamples = useMemo(() => [...userFiles, ...EXAMPLES], [userFiles]);

  const findExample = useCallback((id: string) => {
    return userFiles.find(e => e.id === id) || EXAMPLES.find(e => e.id === id);
  }, [userFiles]);

  const setExample = useCallback((id: string) => {
    const found = findExample(id);
    if (found) {
      setActiveExample(found);
      setSelectedFile(id);
    }
  }, [findExample]);

  const openExample = useCallback((id: string) => {
    const found = findExample(id);
    if (!found) return;
    setOpenExamples(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveExample(found);
    setSelectedFile(id);
  }, [findExample]);

  const closeExample = useCallback((id: string) => {
    setOpenExamples(prev => {
      const newFiles = prev.filter(f => f !== id);
      if (activeExample?.id === id) {
        const idx = prev.indexOf(id);
        if (newFiles.length > 0) {
          const nextId = newFiles[idx > 0 ? idx - 1 : 0];
          const nextExample = findExample(nextId);
          if (nextExample) {
            setActiveExample(nextExample);
            setSelectedFile(nextId);
          }
        } else {
          setActiveExample(null as unknown as Example);
          setSelectedFile(null);
        }
      }
      return newFiles;
    });
  }, [activeExample, findExample]);

  const createFile = useCallback((name: string, dialect: string) => {
    if (!name.trim()) return;
    const id = `user-${Date.now()}`;
    const newFile: Example = {
      id,
      name: name.trim(),
      group: 'Мои файлы',
      dialect,
      content: '',
    };
    setUserFiles(prev => [...prev, newFile]);
    setOpenExamples(prev => [...prev, id]);
    setActiveExample(newFile);
    setSelectedFile(id);
  }, []);

  return (
    <ExampleContext value={{
      activeExample: openExamples.length === 0 ? null : activeExample,
      openExamples,
      selectedFile,
      cursorPosition,
      allExamples,
      setExample,
      openExample,
      closeExample,
      setSelectedFile,
      setCursorPosition,
      createFile,
    }}>
      {children}
    </ExampleContext>
  );
}

export function useExample(): ExampleContextValue {
  const ctx = useContext(ExampleContext);
  if (!ctx) throw new Error('useExample must be used within ExampleProvider');
  return ctx;
}
