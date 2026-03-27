import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { editor } from 'monaco-editor';
import {
  KeywordIndex,
  tokenize,
  LexerError,
  parse,
  ParseError,
  validate,
  type DialectTable,
  type ScriptNode,
  type Token,
  type ValidationDiagnostic,
} from 'coil-runtime/browser';
import { useExample } from './ExampleProvider';
import { dialectRegistry, DEFAULT_DIALECT } from '../coil/dialects';

interface PipelineState {
  source: string;
  dialect: DialectTable;
  tokens: Token[] | null;
  ast: ScriptNode | null;
  diagnostics: ValidationDiagnostic[];
  parseError: string | null;
}

interface PipelineContextValue extends PipelineState {
  updateSource: (source: string) => void;
  registerEditor: (ed: editor.IStandaloneCodeEditor) => void;
  revealDiagnostic: (diag: ValidationDiagnostic) => void;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

function runPipeline(source: string, index: KeywordIndex, dialect: DialectTable): Omit<PipelineState, 'dialect'> {
  try {
    const tokens = tokenize(source, index);
    const ast = parse(tokens, dialect, source);
    const result = validate(ast, dialect);
    const diagnostics = result.diagnostics.filter(
      d => d.ruleId !== 'unsupported-operator',
    );
    return { source, tokens, ast, diagnostics, parseError: null };
  } catch (e) {
    if (e instanceof LexerError || e instanceof ParseError) {
      const errorDiag: ValidationDiagnostic = {
        severity: 'error',
        ruleId: e instanceof LexerError ? 'lexer-error' : 'parse-error',
        message: e.message,
        span: e.span,
      };
      return { source, tokens: null, ast: null, diagnostics: [errorDiag], parseError: e.message };
    }
    throw e;
  }
}

export function PipelineProvider({ children }: { children: ReactNode }) {
  const { activeExample } = useExample();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexCacheRef = useRef<{ name: string; index: KeywordIndex } | null>(null);

  const getDialect = useCallback((): DialectTable => {
    const dialectKey = activeExample?.dialect ?? DEFAULT_DIALECT;
    const d = dialectRegistry.get(dialectKey);
    if (!d) throw new Error(`Unknown dialect: ${dialectKey}`);
    return d;
  }, [activeExample?.dialect]);

  const getIndex = useCallback((dialect: DialectTable): KeywordIndex => {
    const cached = indexCacheRef.current;
    if (cached && cached.name === dialect.name) return cached.index;
    const index = KeywordIndex.build(dialect);
    indexCacheRef.current = { name: dialect.name, index };
    return index;
  }, []);

  const [state, setState] = useState<PipelineState>(() => {
    if (!activeExample) {
      const dialect = dialectRegistry.get(DEFAULT_DIALECT)!;
      return { source: '', dialect, tokens: null, ast: null, diagnostics: [], parseError: null };
    }
    const dialect = getDialect();
    const index = getIndex(dialect);
    return { ...runPipeline(activeExample.content, index, dialect), dialect };
  });

  // Immediate pipeline on example change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!activeExample) {
      setState(prev => ({ ...prev, source: '', tokens: null, ast: null, diagnostics: [], parseError: null }));
      return;
    }
    const dialect = getDialect();
    const index = getIndex(dialect);
    setState({ ...runPipeline(activeExample.content, index, dialect), dialect });
  }, [activeExample, getDialect, getIndex]);

  // M-2: skip debounce if source unchanged (e.g. editor.setValue from example switch)
  const updateSource = useCallback((newSource: string) => {
    setState(prev => {
      if (newSource === prev.source) return prev;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const dialect = getDialect();
        const index = getIndex(dialect);
        setState({ ...runPipeline(newSource, index, dialect), dialect });
      }, 300);
      return prev;
    });
  }, [getDialect, getIndex]);

  // L-1: cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const registerEditor = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
  }, []);

  const revealDiagnostic = useCallback((diag: ValidationDiagnostic) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.revealLineInCenter(diag.span.line);
    ed.setPosition({ lineNumber: diag.span.line, column: diag.span.col });
    ed.focus();
  }, []);

  return (
    <PipelineContext value={{
      ...state,
      updateSource,
      registerEditor,
      revealDiagnostic,
    }}>
      {children}
    </PipelineContext>
  );
}

export function usePipeline(): PipelineContextValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used within PipelineProvider');
  return ctx;
}
