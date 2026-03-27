import type { editor } from 'monaco-editor';

export const COIL_LIGHT_THEME = 'coil-light';
export const COIL_DARK_THEME = 'coil-dark';

// Palette inspired by modern IDE themes — soft purple keywords,
// warm orange templates, green types, cyan participants.

export const coilLightTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // Keywords — rich purple
    { token: 'keyword.operator', foreground: '5530a8' },
    { token: 'keyword.terminator', foreground: '5530a8' },
    { token: 'keyword.modifier', foreground: '1868a0' },                       // sky blue
    { token: 'keyword.policy', foreground: '7050a8', fontStyle: 'italic' },
    { token: 'keyword.type', foreground: '987020' },                           // warm yellow

    // Sigils
    { token: 'variable', foreground: '987020' },              // warm yellow
    { token: 'entity.participant', foreground: '207080' },     // teal/cyan
    { token: 'entity.channel', foreground: '2868a0' },         // blue
    { token: 'entity.promise', foreground: '987020' },         // warm gold
    { token: 'entity.tool', foreground: 'a04040' },            // muted red
    { token: 'entity.stream', foreground: '7050a8' },          // purple

    // Templates — green like types were
    { token: 'delimiter.template', foreground: '207048' },    // green
    { token: 'string.template', foreground: '207048' },       // green

    // Duration
    { token: 'number.duration', foreground: '207080' },       // teal

    // Comments
    { token: 'comment', foreground: '8a8a8a', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background': '#fcfcfa',
    'editor.foreground': '#383838',
    'editorLineNumber.foreground': '#b0b0ae',
    'editorLineNumber.activeForeground': '#707070',
    'editor.lineHighlightBackground': '#f3f3f0',
    'editor.selectionBackground': '#d0d2ce',
    'editorCursor.foreground': '#5060a0',
  },
};

export const coilDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords — rich purple
    { token: 'keyword.operator', foreground: 'c490e0' },
    { token: 'keyword.terminator', foreground: 'c490e0' },
    { token: 'keyword.modifier', foreground: '58b0e8' },                       // sky blue
    { token: 'keyword.policy', foreground: 'b898cc', fontStyle: 'italic' },
    { token: 'keyword.type', foreground: 'd8c880' },                           // warm yellow

    // Sigils
    { token: 'variable', foreground: 'd8c880' },              // warm yellow
    { token: 'entity.participant', foreground: '6cd0d8' },     // cyan
    { token: 'entity.channel', foreground: '7cb8e0' },         // light blue
    { token: 'entity.promise', foreground: 'd8c880' },         // warm gold
    { token: 'entity.tool', foreground: 'e08080' },            // soft red
    { token: 'entity.stream', foreground: 'b898cc' },          // purple

    // Templates — green
    { token: 'delimiter.template', foreground: '8cd4a8' },    // green
    { token: 'string.template', foreground: '8cd4a8' },       // green

    // Duration
    { token: 'number.duration', foreground: '6cd0d8' },       // cyan

    // Comments
    { token: 'comment', foreground: '687078', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background': '#141416',
    'editor.foreground': '#c4c4c4',
    'editorLineNumber.foreground': '#484a4c',
    'editorLineNumber.activeForeground': '#707274',
    'editor.lineHighlightBackground': '#1e1e20',
    'editor.selectionBackground': '#303338',
    'editorCursor.foreground': '#a090d0',
  },
};
