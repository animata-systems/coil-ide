import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { EXAMPLES, type Example } from '../coil/examples';

interface ExampleContextValue {
  activeExample: Example;
  setExample: (id: string) => void;
}

const ExampleContext = createContext<ExampleContextValue | null>(null);

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [activeExample, setActiveExample] = useState<Example>(EXAMPLES[0]);

  const setExample = useCallback((id: string) => {
    const found = EXAMPLES.find(e => e.id === id);
    if (found) setActiveExample(found);
  }, []);

  return (
    <ExampleContext value={{ activeExample, setExample }}>
      {children}
    </ExampleContext>
  );
}

export function useExample(): ExampleContextValue {
  const ctx = useContext(ExampleContext);
  if (!ctx) throw new Error('useExample must be used within ExampleProvider');
  return ctx;
}
