import type { Monaco } from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';
import type { DialectTable } from 'coil-runtime/browser';
import { tokenizeToLineTokens, type MonacoLineTokens } from './tokens-to-monaco';

// ── Per-line state ─────────────────────────────────────────
//
// Monaco's `TokensProvider` is line-based: callback receives one line
// of text and the previous line's `IState`, returns tokens + next state.
// Our runtime tokenizer is whole-document, so the only thing we keep
// in state is the current line index — actual tokens come from a cache
// kept in lock-step with model edits.

class CoilTokenState implements languages.IState {
  readonly lineNumber: number;
  constructor(lineNumber: number) {
    this.lineNumber = lineNumber;
  }
  clone(): CoilTokenState {
    return new CoilTokenState(this.lineNumber);
  }
  equals(other: languages.IState | null): boolean {
    return other instanceof CoilTokenState && other.lineNumber === this.lineNumber;
  }
}

// ── Per-model token cache ──────────────────────────────────
//
// Keyed by `ITextModel` (WeakMap → released with the model). Stores
// the version that produced these tokens plus the per-line array.
// `lastGood` lets us fall back to the previous successful tokenization
// when the lexer fails mid-edit (e.g. heredoc not yet closed) — without
// it the editor would wipe all highlighting until the user finishes
// typing the closing marker. (Phase 2 review followup.)

interface ModelTokenCache {
  version: number;
  lines: MonacoLineTokens[];
  hasErrors: boolean;
  lastGood: MonacoLineTokens[] | null;
}

// ── Provider factory ───────────────────────────────────────

/**
 * Build a Monaco `TokensProvider` for a specific COIL language id.
 *
 * The provider listens for models with the matching language id,
 * subscribes to their content changes, and recomputes the per-line
 * token cache through `tokenizeToLineTokens`. The Monaco-facing
 * `tokenize(line, state)` call simply reads from the cache.
 *
 * Trade-off: side effects (model listeners) live inside this factory.
 * The pure mapping logic stays in `tokens-to-monaco.ts`.
 */
export function createCoilMonacoTokensProvider(
  dialect: DialectTable,
  languageId: string,
  monaco: Monaco,
): languages.TokensProvider {
  const cache = new WeakMap<editor.ITextModel, ModelTokenCache>();

  function recompute(model: editor.ITextModel): void {
    if (model.getLanguageId() !== languageId) return;
    const result = tokenizeToLineTokens(model.getValue(), dialect);
    const previous = cache.get(model);
    const lastGood =
      result.errors.length === 0
        ? result.lines
        : previous?.lastGood ?? null;
    cache.set(model, {
      version: model.getVersionId(),
      lines: result.lines,
      hasErrors: result.errors.length > 0,
      lastGood,
    });
    // No explicit re-tokenize trigger needed: Monaco invalidates its
    // visual token state on `model.onDidChangeContent`, so the next
    // render will call our `tokenize(line, state)` and pick up the
    // freshly stored cache.
  }

  function attach(model: editor.ITextModel): void {
    if (model.getLanguageId() !== languageId) return;
    // Always recompute on attach — re-attach happens when a model's
    // language flips back to ours after a stint as something else and
    // its cache is stale. `cache.has` only guards the content listener
    // to avoid stacking duplicate subscriptions.
    const alreadyAttached = cache.has(model);
    recompute(model);
    if (alreadyAttached) return;
    model.onDidChangeContent(() => recompute(model));
    // No need to clean up — the WeakMap entry disappears with the
    // model itself; Monaco disposes the disposable when the model
    // is disposed.
  }

  // Eagerly attach to existing models with this language.
  for (const m of monaco.editor.getModels()) attach(m);

  // Catch new models created later.
  monaco.editor.onDidCreateModel((m: editor.ITextModel) => attach(m));
  // Language can change after creation — attach on transition into ours.
  monaco.editor.onDidChangeModelLanguage(
    ({ model }: { model: editor.ITextModel }) => attach(model),
  );

  function activeLines(): MonacoLineTokens[] | null {
    // Find the most recently touched model with our language.
    // In practice the playground holds a single editor model per
    // language; if multiple are open at once the last edited one wins.
    let best: { cache: ModelTokenCache; model: editor.ITextModel } | null = null;
    for (const m of monaco.editor.getModels()) {
      if (m.getLanguageId() !== languageId) continue;
      const c = cache.get(m);
      if (!c) continue;
      if (!best || m.getVersionId() >= best.model.getVersionId()) {
        best = { cache: c, model: m };
      }
    }
    if (!best) return null;
    // If the current tokenization failed (LexerError), fall back to the
    // last successful set so the editor doesn't go blank mid-edit
    // (e.g. while typing the closing marker of a heredoc).
    if (best.cache.hasErrors && best.cache.lastGood) {
      return best.cache.lastGood;
    }
    return best.cache.lines;
  }

  return {
    getInitialState(): languages.IState {
      return new CoilTokenState(0);
    },
    tokenize(_line: string, state: languages.IState): languages.ILineTokens {
      const lineNumber = state instanceof CoilTokenState ? state.lineNumber : 0;
      const lines = activeLines();
      const tokens = lines?.[lineNumber]?.tokens ?? [];
      return {
        tokens,
        endState: new CoilTokenState(lineNumber + 1),
      };
    },
  };
}
