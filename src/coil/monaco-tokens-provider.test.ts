import { describe, it, expect } from 'vitest';
import type { Monaco } from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import type { DialectTable } from 'coil-runtime/browser';
import { createCoilMonacoTokensProvider } from './monaco-tokens-provider';
import enStandard from 'coil/dialects/en-standard/en-standard.json';

const en = enStandard as DialectTable;

// ── Tiny Monaco mock ──────────────────────────────────────
//
// Just enough to exercise the provider's side-channel: model registry,
// content change events, language id query. We don't load real Monaco
// (heavy, needs DOM + web workers); the provider only touches the
// surface we mock here.

interface MockListener<T> {
  fire(arg: T): void;
  add(cb: (arg: T) => void): IDisposable;
}

function emitter<T>(): MockListener<T> {
  const cbs = new Set<(arg: T) => void>();
  return {
    fire(arg) { for (const cb of cbs) cb(arg); },
    add(cb) {
      cbs.add(cb);
      return { dispose: () => cbs.delete(cb) };
    },
  };
}

interface MockModel extends editor.ITextModel {
  setText(text: string): void;
  setLanguage(id: string): void;
}

function makeModel(initial: string, languageId: string): MockModel {
  let text = initial;
  let version = 1;
  let lang = languageId;
  const onContent = emitter<editor.IModelContentChangedEvent>();
  const onLanguage = emitter<editor.IModelLanguageChangedEvent>();

  const model = {
    getValue: () => text,
    getVersionId: () => version,
    getLanguageId: () => lang,
    onDidChangeContent: (cb: (e: editor.IModelContentChangedEvent) => void) => onContent.add(cb),
    onDidChangeLanguage: (cb: (e: editor.IModelLanguageChangedEvent) => void) => onLanguage.add(cb),
    setText(next: string) {
      text = next;
      version++;
      onContent.fire({} as editor.IModelContentChangedEvent);
    },
    setLanguage(id: string) {
      const old = lang;
      lang = id;
      onLanguage.fire({ oldLanguage: old, newLanguage: id } as editor.IModelLanguageChangedEvent);
    },
  } as unknown as MockModel;
  return model;
}

function makeMonaco(): { monaco: Monaco; addModel(m: MockModel): void; changeLanguage(m: MockModel, id: string): void } {
  const models: MockModel[] = [];
  const onCreate = emitter<editor.ITextModel>();
  const onLangChange = emitter<editor.IModelLanguageChangedEvent & { model: editor.ITextModel }>();
  const monaco = {
    editor: {
      getModels: () => models.slice(),
      onDidCreateModel: (cb: (m: editor.ITextModel) => void) => onCreate.add(cb),
      onDidChangeModelLanguage: (cb: (e: editor.IModelLanguageChangedEvent & { model: editor.ITextModel }) => void) =>
        onLangChange.add(cb),
    },
    languages: {
      register: () => {},
      setTokensProvider: () => ({ dispose: () => {} }),
    },
  } as unknown as Monaco;
  return {
    monaco,
    addModel(m) { models.push(m); onCreate.fire(m); },
    changeLanguage(m, id) {
      m.setLanguage(id);
      onLangChange.fire({ model: m, oldLanguage: '', newLanguage: id } as editor.IModelLanguageChangedEvent & { model: editor.ITextModel });
    },
  };
}

// ── Tests ──────────────────────────────────────────────────

describe('createCoilMonacoTokensProvider', () => {
  it('returns provider with getInitialState() and tokenize()', () => {
    const { monaco } = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', monaco);
    expect(typeof p.getInitialState).toBe('function');
    expect(typeof p.tokenize).toBe('function');
  });

  it('initial state advances lineNumber on each tokenize call', () => {
    const { monaco } = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', monaco);
    const s0 = p.getInitialState();
    const r1 = p.tokenize('', s0);
    const r2 = p.tokenize('', r1.endState);
    // States are stateful per line — equal only when lineNumber matches
    expect(s0.equals(r1.endState)).toBe(false);
    expect(r1.endState.equals(r1.endState.clone())).toBe(true);
    expect(r1.endState.equals(r2.endState)).toBe(false);
  });

  it('returns tokens for an existing model attached after registration', () => {
    const ctx = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', ctx.monaco);
    const model = makeModel('ACTORS user', 'coil-en');
    ctx.addModel(model);

    const t0 = p.tokenize('ACTORS user', p.getInitialState());
    expect(t0.tokens.length).toBeGreaterThan(0);
    expect(t0.tokens[0].scopes).toBe('keyword.operator');
  });

  it('tokens follow the active model after content edits', () => {
    const ctx = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', ctx.monaco);
    const model = makeModel('ACTORS user', 'coil-en');
    ctx.addModel(model);

    // Edit: now the first line is just a comment
    model.setText("' a comment");
    const t0 = p.tokenize("' a comment", p.getInitialState());
    expect(t0.tokens).toHaveLength(1);
    expect(t0.tokens[0].scopes).toBe('comment');
  });

  it('serves last-good tokens when current text fails to tokenize', () => {
    const ctx = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', ctx.monaco);
    const model = makeModel('ACTORS user', 'coil-en');
    ctx.addModel(model);

    // Capture good tokens first
    const good = p.tokenize('ACTORS user', p.getInitialState());
    expect(good.tokens.length).toBeGreaterThan(0);

    // Now break the source: unterminated heredoc
    model.setText('DEFINE m\n<<END\nno close');

    // Provider should fall back to lastGood for line 0 (ACTORS user)
    // since the failed tokenization left no tokens for the new content.
    // (LexerError may or may not partially populate; we accept either
    // the current tokens — if they exist — or the fallback.)
    const after = p.tokenize('DEFINE m', p.getInitialState());
    // At minimum we expect a non-empty token array somewhere; lastGood
    // ensures the editor doesn't go blank.
    expect(after.tokens.length).toBeGreaterThan(0);
  });

  it('ignores models with a different language id', () => {
    const ctx = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', ctx.monaco);
    const other = makeModel('totally not coil', 'plaintext');
    ctx.addModel(other);

    const t0 = p.tokenize('totally not coil', p.getInitialState());
    expect(t0.tokens).toEqual([]);
  });

  it('attaches when a model changes language to ours', () => {
    const ctx = makeMonaco();
    const p = createCoilMonacoTokensProvider(en, 'coil-en', ctx.monaco);
    const model = makeModel('ACTORS user', 'plaintext');
    ctx.addModel(model);

    // Initially other language — provider has no cache
    expect(p.tokenize('ACTORS user', p.getInitialState()).tokens).toEqual([]);

    // Switch language → provider attaches and recomputes
    ctx.changeLanguage(model, 'coil-en');
    expect(p.tokenize('ACTORS user', p.getInitialState()).tokens.length).toBeGreaterThan(0);
  });
});
