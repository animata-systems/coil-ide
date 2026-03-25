import type { editor } from 'monaco-editor';

export const COIL_LIGHT_THEME = 'coil-light';
export const COIL_DARK_THEME = 'coil-dark';

export const coilLightTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // Keywords
    { token: 'keyword.operator', foreground: '7c3aed', fontStyle: 'bold' },   // purple-600
    { token: 'keyword.terminator', foreground: '7c3aed' },                     // purple-600
    { token: 'keyword.modifier', foreground: '0369a1' },                       // sky-700
    { token: 'keyword.policy', foreground: '0369a1', fontStyle: 'italic' },    // sky-700
    { token: 'keyword.type', foreground: '6d28d9' },                           // violet-700

    // Sigils
    { token: 'variable', foreground: 'c2410c' },              // orange-700
    { token: 'entity.participant', foreground: '15803d' },     // green-700
    { token: 'entity.channel', foreground: '0e7490' },        // cyan-700
    { token: 'entity.promise', foreground: 'a16207' },        // yellow-700
    { token: 'entity.tool', foreground: 'b91c1c' },           // red-700
    { token: 'entity.stream', foreground: '7e22ce' },         // purple-700

    // Templates
    { token: 'delimiter.template', foreground: '9a3412' },    // orange-800
    { token: 'string.template', foreground: '92400e' },       // amber-800

    // Duration
    { token: 'number.duration', foreground: '0f766e' },       // teal-700

    // Comments
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },  // gray-500
  ],
  colors: {},
};

export const coilDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords
    { token: 'keyword.operator', foreground: 'c084fc', fontStyle: 'bold' },   // purple-400
    { token: 'keyword.terminator', foreground: 'c084fc' },                     // purple-400
    { token: 'keyword.modifier', foreground: '7dd3fc' },                       // sky-300
    { token: 'keyword.policy', foreground: '7dd3fc', fontStyle: 'italic' },    // sky-300
    { token: 'keyword.type', foreground: 'a78bfa' },                           // violet-400

    // Sigils
    { token: 'variable', foreground: 'fb923c' },              // orange-400
    { token: 'entity.participant', foreground: '4ade80' },     // green-400
    { token: 'entity.channel', foreground: '22d3ee' },        // cyan-400
    { token: 'entity.promise', foreground: 'facc15' },        // yellow-400
    { token: 'entity.tool', foreground: 'f87171' },           // red-400
    { token: 'entity.stream', foreground: 'e879f9' },         // fuchsia-400

    // Templates
    { token: 'delimiter.template', foreground: 'fb923c' },    // orange-400
    { token: 'string.template', foreground: 'fbbf24' },       // amber-400

    // Duration
    { token: 'number.duration', foreground: '2dd4bf' },       // teal-400

    // Comments
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },  // gray-500
  ],
  colors: {},
};
