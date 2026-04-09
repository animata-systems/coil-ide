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

export interface PipelineProviderProps {
  /** External source of truth for editor contents. */
  source: string;
  /** Dialect to parse/validate against. */
  dialect: DialectTable;
  /** Debounce delay for user-driven updates (ms). Default 300. */
  debounceMs?: number;
  children: ReactNode;
}

/**
 * Library-level provider. Runs tokenize→parse→validate and exposes the
 * result via `usePipeline()`. Controlled by `source` + `dialect` props; the
 * owner decides where source and dialect come from.
 */
export function PipelineProvider({ source, dialect, debounceMs = 300, children }: PipelineProviderProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexCacheRef = useRef<{ name: string; index: KeywordIndex } | null>(null);

  const getIndex = useCallback((d: DialectTable): KeywordIndex => {
    const cached = indexCacheRef.current;
    if (cached && cached.name === d.name) return cached.index;
    const index = KeywordIndex.build(d);
    indexCacheRef.current = { name: d.name, index };
    return index;
  }, []);

  const [state, setState] = useState<PipelineState>(() => {
    const index = getIndex(dialect);
    return { ...runPipeline(source, index, dialect), dialect };
  });

  // External source/dialect change: reset internal state immediately,
  // cancelling any pending debounced pipeline run.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const index = getIndex(dialect);
    setState({ ...runPipeline(source, index, dialect), dialect });
  }, [source, dialect, getIndex]);

  // User edits: debounce, then re-run pipeline locally. The external prop
  // `source` is not touched here — the owner decides whether to mirror it
  // back via onChange.
  //
  // Side effects (clearTimeout/setTimeout) live *outside* the setState
  // updater so React's Strict Mode double-invocation does not schedule two
  // debounced runs.
  const updateSource = useCallback((newSource: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setState(current => {
        const index = getIndex(current.dialect);
        return { ...runPipeline(newSource, index, current.dialect), dialect: current.dialect };
      });
    }, debounceMs);
    setState(prev => (newSource === prev.source ? prev : { ...prev, source: newSource }));
  }, [getIndex, debounceMs]);

  // Cleanup debounce on unmount
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
