import {
  tokenize,
  KeywordIndex,
  LexerError,
  type Token,
  type DialectTable,
} from 'coil-runtime/browser';

// ── Public types ───────────────────────────────────────────
//
// Mirrors `monaco.languages.IToken` / `ILineTokens` shape without
// importing `monaco-editor`. Keeps this module pure and Monaco-free —
// the Monaco wrapper lives in a separate Phase-3 file (I-0015).

export interface MonacoToken {
  /** Column position of the token start within its line, zero-based. */
  startIndex: number;
  /** Monaco token scope string, e.g. `"keyword.operator"`. */
  scopes: string;
}

export interface MonacoLineTokens {
  tokens: MonacoToken[];
}

export interface TokenizeToLineTokensResult {
  /** One entry per source line. Empty lines have an empty `tokens` array. */
  lines: MonacoLineTokens[];
  /** Lexer errors collected during tokenization (for diagnostics — Phase 4). */
  errors: LexerError[];
}

// ── Token → scope mapping (I-0015) ─────────────────────────

/**
 * Map a runtime `Token` to a Monaco scope string. Returns `null` for
 * tokens that should not surface in highlighting (`Newline`, `EOF`).
 *
 * `Keyword` tokens dispatch on the prefix of their first abstract id:
 *   Op.*   → keyword.operator
 *   Mod.*  → keyword.modifier
 *   Pol.*  → keyword.policy
 *   Typ.*  → keyword.type
 *   Kw.*   → keyword.terminator (currently only `Kw.End`)
 *   Expr.* → keyword.expression (And, Or, Not, True, False)
 */
export function mapTokenToScope(token: Token): string | null {
  switch (token.type) {
    case 'Keyword': {
      const id = token.ids[0] ?? '';
      if (id.startsWith('Op.')) return 'keyword.operator';
      if (id.startsWith('Mod.')) return 'keyword.modifier';
      if (id.startsWith('Pol.')) return 'keyword.policy';
      if (id.startsWith('Typ.')) return 'keyword.type';
      if (id.startsWith('Kw.')) return 'keyword.terminator';
      if (id.startsWith('Expr.')) return 'keyword.expression';
      // Unknown abstract namespace — degrade gracefully to a generic keyword.
      return 'keyword';
    }
    case 'Identifier':
      return 'identifier';

    // Typed references (CSS classes mirror I-0012 — единая палитра)
    case 'ValueRef':
      return 'variable';
    case 'ParticipantRef':
      return 'entity.participant';
    case 'ChannelRef':
      return 'entity.channel';
    case 'PromiseRef':
      return 'entity.promise';
    case 'ToolRef':
      return 'entity.tool';
    case 'StreamRef':
      return 'entity.stream';

    // Templates
    case 'TemplateOpen':
    case 'TemplateClose':
      return 'delimiter.template';
    case 'HeredocOpen':
    case 'HeredocClose':
      return 'delimiter.heredoc';
    case 'TextFragment':
      return 'string.template';

    // Literals
    case 'DurationLiteral':
      return 'number.duration';
    case 'NumberLiteral':
      return 'number';
    case 'StringLiteral':
      return 'string';
    case 'Comparison':
      return 'operator.comparison';

    // Comments
    case 'Comment':
      return 'comment';

    // Punctuation
    case 'Star':
    case 'Dash':
    case 'Colon':
    case 'Comma':
    case 'ParenOpen':
    case 'ParenClose':
      return 'delimiter';

    // Structural — never highlighted
    case 'Newline':
    case 'EOF':
      return null;
  }
}

// ── Multi-line splitting ───────────────────────────────────

interface PlacedToken {
  /** 0-based line index in the source. */
  line: number;
  /** 0-based column index where the token starts on its line. */
  startIndex: number;
  scopes: string;
}

/**
 * Multi-line `TextFragment` tokens (heredoc bodies) span several lines.
 * Monaco wants per-line token arrays, so we split the fragment into one
 * entry per line: the first entry keeps the original column, the rest
 * start at column 0 of their respective line.
 */
function placeTextFragment(
  startLine: number,
  startCol: number,
  value: string,
  scopes: string,
): PlacedToken[] {
  if (value.length === 0) {
    return [{ line: startLine, startIndex: startCol, scopes }];
  }
  const chunks = value.split('\n');
  if (chunks.length === 1) {
    return [{ line: startLine, startIndex: startCol, scopes }];
  }
  const placed: PlacedToken[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const lineIdx = startLine + i;
    const col = i === 0 ? startCol : 0;
    // Skip empty trailing chunk produced by a value ending in `\n` —
    // there is no visible content to highlight on that line.
    if (i === chunks.length - 1 && chunks[i].length === 0) continue;
    placed.push({ line: lineIdx, startIndex: col, scopes });
  }
  return placed;
}

// ── Public entry point ─────────────────────────────────────

/**
 * Tokenize `source` through the runtime lexer and project the result
 * onto Monaco's per-line token model. The output is a parallel array
 * of `MonacoLineTokens` aligned with `source.split('\n')`.
 *
 * `LexerError` is caught: partial tokens emitted before the failure
 * are still returned, and the error is added to `errors` so the editor
 * pipeline (Phase 4) can publish it as a Monaco marker.
 */
export function tokenizeToLineTokens(
  source: string,
  dialect: DialectTable,
): TokenizeToLineTokensResult {
  // `split('\n')` on an empty string returns `['']` — one empty line,
  // which matches Monaco's view of an empty document.
  const lineCount = source.split('\n').length;
  const lines: MonacoLineTokens[] = Array.from({ length: lineCount }, () => ({ tokens: [] }));
  const errors: LexerError[] = [];

  let tokens: Token[] = [];
  try {
    const kwIndex = KeywordIndex.build(dialect);
    tokens = tokenize(source, kwIndex);
  } catch (err) {
    if (err instanceof LexerError) {
      errors.push(err);
    } else {
      throw err;
    }
  }

  for (const token of tokens) {
    const scopes = mapTokenToScope(token);
    if (scopes === null) continue;

    const startLine = token.span.line - 1; // runtime spans are 1-based
    const startCol = token.span.col - 1;

    let placed: PlacedToken[];
    if (token.type === 'TextFragment' && token.value.includes('\n')) {
      placed = placeTextFragment(startLine, startCol, token.value, scopes);
    } else {
      placed = [{ line: startLine, startIndex: startCol, scopes }];
    }

    for (const p of placed) {
      // Defensive: skip tokens whose lines fall outside the source
      // (shouldn't happen with well-formed spans, but a partial lexer
      // failure could in principle leave stale spans).
      if (p.line < 0 || p.line >= lineCount) continue;
      lines[p.line].tokens.push({ startIndex: p.startIndex, scopes: p.scopes });
    }
  }

  // Monaco expects per-line tokens sorted by startIndex.
  for (const line of lines) {
    line.tokens.sort((a, b) => a.startIndex - b.startIndex);
  }

  return { lines, errors };
}
