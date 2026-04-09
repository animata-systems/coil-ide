# coil-ide

Editor components and headless pipeline for COIL scripts. Provides syntax highlighting (Monaco), validation, and a structural COIL-H table view, packaged as a reusable React library.

**[Try the Playground](https://animata-systems.github.io/coil-ide/)**

## What this is

COIL was designed for operators, not programmers. `coil-ide` is the primary interface for writing COIL scripts without touching the canonical text format.

The library implements [COIL-H](https://github.com/animata-systems/coil/blob/main/spec/11-coil-h.md) — a tabular projection of COIL-C:

- Each operator is a row: `№ | Operator | Body | Name`
- Nested blocks (IF, REPEAT, EACH) use dot-notation step numbering: `5.1`, `5.2`
- Section comments render as full-width dividers
- Modifiers, templates and `RESULT` blocks are rendered as structured cells, not flat text

Components and headless helpers can be embedded in any React app (or plain JS app, via the headless entry) that needs to show COIL scripts — a sandbox, a docs site, a review tool.

## Install

```sh
npm install github:animata-systems/coil-ide
```

Peer dependencies (provided by the consumer):

- `react` ≥ 19
- `react-dom` ≥ 19
- `monaco-editor` ≥ 0.25 (only if using `EditorView`)
- `@monaco-editor/react` ^4.7 (only if using `EditorView`)

The headless entry has no React or Monaco dependency.

## Entry points

The package exposes three subpaths:

| Subpath | Use when |
|---|---|
| `coil-ide` | You want React components (`EditorView`, `CoilHTable`, `PipelineProvider`) together with the headless pipeline. |
| `coil-ide/headless` | You only need `tokenize` → `parse` → `validate` → `astToCoilH` and the dialect registry. No React, no Monaco. |
| `coil-ide/theme.css` | A single CSS file with the theme variables the components expect (`--color-foreground`, `--color-ide-panel`, …) plus the dark variant. Import it once from your stylesheet. |

### React components

```tsx
import {
  PipelineProvider,
  EditorView,
  CoilHTable,
  dialectRegistry,
  DEFAULT_DIALECT,
} from 'coil-ide';
import 'coil-ide/theme.css';

const dialect = dialectRegistry.get(DEFAULT_DIALECT)!;

function MyEditor({ source }: { source: string }) {
  return (
    <PipelineProvider source={source} dialect={dialect}>
      <div className="dark" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <EditorView value={source} dialect={DEFAULT_DIALECT} theme="dark" />
        {/* CoilHTable gets its rows via usePipeline() or from your own parse result */}
      </div>
    </PipelineProvider>
  );
}
```

`EditorView` is controlled: pass `value`, optionally `onChange`, `readOnly`, and a `dialect` name. The dark palette is activated by putting `className="dark"` on a container inside the viewer — it is scoped to that subtree and does not touch the rest of the page.

### Headless pipeline

For servers, tests, or non-React UIs:

```ts
import {
  tokenize,
  parse,
  validate,
  KeywordIndex,
  astToCoilH,
  dialectRegistry,
  DEFAULT_DIALECT,
} from 'coil-ide/headless';

const dialect = dialectRegistry.get(DEFAULT_DIALECT)!;
const index = KeywordIndex.build(dialect);
const tokens = tokenize(source, index);
const ast = parse(tokens, dialect, source);
const diagnostics = validate(ast);
const rows = astToCoilH(ast, source, dialect);
```

The headless entry re-exports the parser, validator, and error types from [`coil-runtime`](https://github.com/animata-systems/coil-runtime) for convenience.

### Theme

`coil-ide/theme.css` is a standalone CSS file containing the CSS variables and the Tailwind v4 `@theme inline` block that the components resolve their classes against. Import it once from your stylesheet, **after** `@import 'tailwindcss'`:

```css
@import 'tailwindcss';
@import 'coil-ide/theme.css';
```

The component subtree must have `className="dark"` somewhere above it to pick up the dark palette. The file contains a `@custom-variant dark (&:where(.dark, .dark *))` so the dark scope never leaks out of that subtree.

## Playground

This repo also contains a small Vite playground (`playground/`) that consumes the library through the same public entry points a third-party consumer would use. It serves two purposes: as a runnable demo of the library, and as the canonical compatibility target — if the playground renders correctly, the library contract is intact.

Run locally:

```sh
npm install
npm run dev
```

Build the library + playground:

```sh
npm run build
```

## Dependencies

- [coil-runtime](https://github.com/animata-systems/coil-runtime) — parser, validator, AST types (re-exported through both entry points for consumer convenience)

## Related

- [coil](https://github.com/animata-systems/coil) — language specification
- [coil-runtime](https://github.com/animata-systems/coil-runtime) — runtime implementation
- [coil-sandbox](https://github.com/animata-systems/coil-sandbox) — local host environment (first external consumer of this library)

---

Animata Systems
