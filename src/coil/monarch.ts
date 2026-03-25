import type { languages } from 'monaco-editor';
import type { DialectTable } from './dialects';

/**
 * Escape special regex chars in a string.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a regex pattern that matches any of the given words/phrases.
 * Multi-word phrases use \s+ between words.
 * Sorted longest-first for correct greedy matching.
 */
function buildKeywordPattern(words: string[]): string {
  if (words.length === 0) return '\0';
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const patterns = sorted.map(w => {
    const parts = w.split(/\s+/);
    return parts.map(escapeRegex).join('\\s+');
  });
  return patterns.join('|');
}

/**
 * Generate a Monarch language definition from a DialectTable.
 */
export function buildMonarchLanguage(dialect: DialectTable): languages.IMonarchLanguage {
  const operatorWords = Object.values(dialect.operators);
  const terminatorWords = Object.values(dialect.terminators);
  const modifierWords = Object.values(dialect.modifiers);
  const policyWords = Object.values(dialect.policies);
  const resultTypeWords = Object.values(dialect.resultTypes);
  const durationSuffixes = Object.values(dialect.durationSuffixes);

  const operatorPattern = buildKeywordPattern(operatorWords);
  const terminatorPattern = buildKeywordPattern(terminatorWords);
  const modifierPattern = buildKeywordPattern(modifierWords);
  const policyPattern = buildKeywordPattern(policyWords);
  const resultTypePattern = buildKeywordPattern(resultTypeWords);
  const durationSuffixPattern = durationSuffixes.map(escapeRegex).join('|');

  return {
    defaultToken: '',
    ignoreCase: false,

    tokenizer: {
      root: [
        // Comments: ' to end of line
        [/'.*$/, 'comment'],

        // Template open
        [/<</, 'delimiter.template', '@template'],

        // Duration literals: number + suffix (must precede general number rule)
        [new RegExp(`\\d+(?:${durationSuffixPattern})(?=\\s|$|')`), 'number.duration'],

        // Operators (longest match first)
        [new RegExp(`(?:${operatorPattern})(?=\\s|$|')`), 'keyword.operator'],

        // Terminators (END)
        [new RegExp(`(?:${terminatorPattern})(?=\\s|$|')`), 'keyword.terminator'],

        // Modifiers (longest match first)
        [new RegExp(`(?:${modifierPattern})(?=\\s|$|')`), 'keyword.modifier'],

        // Policies
        [new RegExp(`(?:${policyPattern})(?=\\s|$|')`), 'keyword.policy'],

        // Result types
        [new RegExp(`(?:${resultTypePattern})(?=\\s|$|')`), 'keyword.type'],

        // Sigils: $name, $name.field
        [/\$[\w]+(?:\.[\w]+)*/, 'variable'],

        // @participant
        [/@[\w]+/, 'entity.participant'],

        // #channel, #channel/path
        [/#[\w]+(?:\/[\w$]+)*/, 'entity.channel'],

        // ?promise
        [/\?[\w]+/, 'entity.promise'],

        // !tool
        [/![\w]+/, 'entity.tool'],

        // ~stream
        [/~[\w]+/, 'entity.stream'],

        // Numbers (plain)
        [/\d+/, 'number'],

        // Identifiers
        [/[\w]+/, 'identifier'],

        // Whitespace
        [/\s+/, 'white'],

        // Commas
        [/,/, 'delimiter'],
      ],

      template: [
        // Template close
        [/>>/, 'delimiter.template', '@pop'],

        // $ref inside template
        [/\$[\w]+(?:\.[\w]+)*/, 'variable'],

        // Template text (any chars except >> and $)
        [/[^>$]+/, 'string.template'],

        // Single > that isn't >>
        [/>(?!>)/, 'string.template'],

        // $ not followed by word char
        [/\$/, 'string.template'],
      ],
    },
  };
}
