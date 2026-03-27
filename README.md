# coil-ide

Web editor for COIL scripts. Provides syntax highlighting, validation, and a table-based view (COIL-H) with live two-way synchronization to COIL-C.

**[Try the Playground](https://animata-systems.github.io/coil-ide/)**

## What this is

COIL was designed for operators, not programmers. `coil-ide` is the primary interface for writing COIL scripts without touching the canonical text format.

The editor implements [COIL-H](https://github.com/animata-systems/coil/blob/main/spec/11-coil-h.md) — a tabular projection of COIL-C:

- Each operator is a row: `№ | Operator | Body | Name`
- Nested blocks (IF, REPEAT, EACH) use dot-notation step numbering: `5.1`, `5.2`
- Section comments render as full-width dividers
- Editing the table writes back to valid COIL-C

## Features

| Feature | Status |
|---|---|
| Syntax highlighting (COIL-C) | ✅ |
| Basic validation, error highlighting | ✅ |
| COIL-H table view | ✅ |
| Dialect switcher | ✅ |
| Two-way sync: table ↔ COIL-C | Planned |
| Flow graph visualization | Planned |
| Block fold/unfold | Planned |

## COIL-H table structure

| Column | Content | Editable |
|---|---|---|
| № | Step number (auto) | No |
| Operator | Keyword (dialect-aware dropdown) | Yes |
| Body | Modifiers, templates, arguments, RESULT | Yes |
| Name | Result binding name | Yes |

## Dependencies

- [coil-runtime](https://github.com/animata-systems/coil-runtime) — parser and AST 

## Related

- [coil](https://github.com/animata-systems/coil) — language specification
- [coil-runtime](https://github.com/animata-systems/coil-runtime) — runtime implementation

---

Animata Systems
