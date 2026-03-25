import type { SourceSpan } from 'coil-runtime/browser';

interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export function spanToRange(span: SourceSpan, source: string): IRange {
  const start = span.offset;
  const end = span.offset + span.length;

  let endLine = span.line;
  let endCol = span.col;
  for (let i = start; i < end && i < source.length; i++) {
    if (source[i] === '\n') {
      endLine++;
      endCol = 1;
    } else {
      endCol++;
    }
  }

  return {
    startLineNumber: span.line,
    startColumn: span.col,
    endLineNumber: endLine,
    endColumn: endCol,
  };
}
