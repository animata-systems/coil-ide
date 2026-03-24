# coil-ide

Web editor for COIL scripts. Provides a table-based view (COIL-H) with live two-way synchronization to COIL-C.

## What this is

COIL was designed for operators, not programmers. `coil-ide` is the primary interface for writing COIL scripts without touching the canonical text format.

The editor implements [COIL-H](https://github.com/animata-systems/coil/blob/main/spec/11-coil-h.md) — a tabular projection of COIL-C:

- Each operator is a row: `№ | Operator | Body | Name`
- Nested blocks (IF, REPEAT, EACH) use dot-notation step numbering: `5.1`, `5.2`
- Section comments render as full-width dividers
- Editing the table writes back to valid COIL-C

## Status

| Feature | Status |
|---|---|
| Syntax highlighting (COIL-C) | Planned |
| Basic validation, error highlighting | Planned |
| COIL-H table view | Planned |
| Two-way sync: table ↔ COIL-C | Planned |
| Dialect switcher | Planned |
| Flow graph visualization | Planned |
| Block fold/unfold | Planned |

## Phases

**Phase 0 — Playground**

Web editor for COIL-C with syntax highlighting and basic validation. No runtime required. Goal: let people write and read COIL before the full implementation exists.

- Keyword and sigil highlighting
- Inline error markers (undeclared actors, modifier order violations)
- Canonical (RU) and en-standard dialects

**Phase 3 — Full IDE**

Built on top of the parser from [coil-runtime](https://github.com/animata-systems/coil-runtime).

- COIL-H table editor with live AST sync
- One-click dialect switching with keyword auto-translation
- Flow visualization: step graph, promises, dependencies

## COIL-H table structure

| Column | Content | Editable |
|---|---|---|
| № | Step number (auto) | No |
| Operator | Keyword (dialect-aware dropdown) | Yes |
| Body | Modifiers, templates, arguments, RESULT | Yes |
| Name | Result binding name | Yes |

## Dependencies

- [coil-runtime](https://github.com/animata-systems/coil-runtime) — parser and AST (phase 3+)

## Related

- [coil](https://github.com/animata-systems/coil) — language specification
- [coil-runtime](https://github.com/animata-systems/coil-runtime) — runtime implementation

---

Animata Systems
