# CLAUDE.md — Gridix development guide for Claude Code

## What this project is

Gridix is a TypeScript-first, AEM-compatible DataTables alternative. The core constraint is **zero JavaScript required from AEM authors** — every feature is configurable through `data-gridix-*` HTML attributes set in AEM dialog fields.

## Naming rule (strict)

`gridix` is never abbreviated. `grd`, `grix`, or any other short form must not appear in identifiers, class names, attribute names, or file names. Other abbreviations are fine: `col`, `px`, `dir`, `btn`, `str`, `num`, etc.

## File naming convention

All source files and folders use **kebab-case**. Examples: `gridix-table.ts`, `auto-init.ts`, `row-select.ts`, `keyboard-nav.ts`, `col-visibility.ts`, `data-parser.ts`, `width-detector.ts`. Never use camelCase or PascalCase for file names.

## Build outputs

| File | Entry | Format | Minified | Sourcemap |
|------|-------|--------|----------|-----------|
| `dist/scripts/gridix.esm.js` | `src/index.ts` | ESM | No | Yes |
| `dist/scripts/gridix.esm.min.js` | `src/index.ts` | ESM | Yes | No |
| `dist/scripts/gridix.cjs.js` | `src/index.ts` | CJS | No | Yes |
| `dist/scripts/gridix.cjs.min.js` | `src/index.ts` | CJS | Yes | No |
| `dist/scripts/gridix.umd.js` | `src/index.ts` | UMD | No | Yes |
| `dist/scripts/gridix.umd.min.js` | `src/index.ts` | UMD | Yes | No |
| `dist/scripts/gridix.cdn.js` | `src/cdn.ts` | IIFE | No | Yes |
| `dist/scripts/gridix.cdn.min.js` | `src/cdn.ts` | IIFE | Yes | No |
| `dist/styles/gridix.css` | `src/styles/gridix.css` | CSS | No | Yes |
| `dist/styles/gridix.min.css` | `src/styles/gridix.css` | CSS | Yes | No |
| `dist/gridix.d.ts` | `src/index.ts` | DTS | — | — |

`dist/scripts/` holds all JS outputs. `dist/styles/` holds all CSS outputs. `dist/gridix.d.ts` is at the dist root. Unminified files include external sourcemaps; minified files do not.

## CDN vs ESM split

`src/index.ts` — pure exports, no side effects. `"sideEffects": false` in `package.json` makes it fully tree-shakeable.
`src/cdn.ts` — re-exports everything from `index.ts` **plus** a `DOMContentLoaded` auto-init that scans `[data-gridix]` tables. The side effect lives here only, so importing the ESM build never double-initialises.

## Development workflow

```bash
npm run dev          # Vite dev server at http://localhost:3000/demos/index.html
npm run build        # Full build: JS (Rollup) + CSS (lightningcss)
npm run build:js     # Rollup only — all 8 JS outputs + .d.ts
npm run build:css    # lightningcss only — via scripts/build-css.mjs
npm test             # Vitest with jsdom — 225 tests across 14 files
npm run format       # Prettier — format all source files
npm run lint         # ESLint — lint src/ and tests/
npm run lint:css     # Stylelint — lint src/styles/
```

Vite root is the **project root** (not `demos/`). Demos import from `/src/` paths. Never set `root: 'demos'` in `vite.demo.config.ts` — it silently breaks asset resolution with no console errors.

## Source structure

```
src/
  index.ts            — ESM/CJS/UMD entry (no side effects, tree-shakeable)
  cdn.ts              — CDN IIFE entry (auto-init side effect)
  types.ts            — all TypeScript types and interfaces
  constants.ts        — ATTR (data attribute names), CSS class names, DEFAULTS
  connectors/
    react.ts          — React hook pattern + createGridix() helper
    vue.ts            — Vue 3 composable + vGridix directive template
    svelte.ts         — Svelte action (use:gridix) — ready to use
    angular.ts        — Angular directive template + createGridixController()
  core/
    gridix-table.ts   — main class, wires all features together
    auto-init.ts      — exported autoInit() function (no module-level side effect)
  features/
    sorting.ts        — sortRows, updateHeaderClasses, handleHeaderClick
    filtering.ts      — filterRows, highlightCells (XSS-safe DOM API only)
    pagination.ts     — applyPagination, renderPagination helpers
    row-select.ts     — toggleRowSelect, syncRowClasses (sets aria-selected)
    col-visibility.ts — applyColVisibility
    export.ts         — exportCSV, exportJSON, copyToClipboard (CSV injection prevention)
    keyboard-nav.ts   — initKeyboardNav (roving tabindex, arrow keys), refreshTabindex
  utils/
    dom.ts            — el() factory, dispatch(), debounce(), escapeHtml()
    data-parser.ts    — parseAttr, parseList, parseNumList, parseBool
    width-detector.ts — measureNaturalWidth (sets width:auto, reads scrollWidth, restores)
    announce.ts       — singleton aria-live region for screen reader announcements
  styles/
    variables.css     — CSS custom properties declared at :root (--gridix-* tokens only)
    base.css          — .gridix-wrapper, .gridix-sr-only, .gridix-scroll
    table.css         — thead, th, td, sort indicators, highlights
    toolbar.css       — toolbar, search, col-vis dropdown, export menu (mobile-first)
    pagination.css    — footer, page buttons (mobile-first)
    themes.css        — default/minimal/dark themes + prefers-color-scheme: dark
    print.css         — @media print: hide controls, show all rows
    gridix.css        — entry, @import all partials

demos/
  index.html          — hub / navigation
  basic.html          — all features via data attributes
  responsive.html     — per-table natural-width showcase
  aem.html            — CDN auto-init, pure data-attribute configuration
  advanced.html       — row select, sticky header, multi-sort
  themes.html         — default / minimal / dark side by side
  print.html          — print-optimised output demo
  lighthouse.html     — performance / accessibility optimised demo

docs/
  gridix-specs.md     — full specification, implementation plan, real-world problem solutions

scripts/
  build-css.mjs       — lightningcss Node.js API build script
```

## CSS architecture (no SASS)

All styles are written in modern CSS (no SASS/SCSS). Partials live in `src/styles/` and are bundled by `scripts/build-css.mjs` using the **lightningcss** Node.js API (`import { bundle, Features } from 'lightningcss'`).

Key rules:
- All `--gridix-*` custom properties are declared at `:root` in `variables.css`.
- Every other selector is scoped inside `.gridix-wrapper` — never at the root level.
- CSS nesting is used (transformed by lightningcss with `Features.Nesting`).
- Never use the `lightningcss` CLI (`lightningcss-cli` is a separate package). Always call the Node.js API.
- The CSS `@import` chain starts at `src/styles/gridix.css` and `@import`s each partial in order.

## Mobile-first layout

Default layout is mobile (stacked). `@media (min-width: 1280px)` triggers the desktop layout (toolbar row, footer row). The value `1280px` is referenced as `--gridix-breakpoint-desktop` in `variables.css` (JS reference only — CSS media queries use the literal value).

## Dark mode

Two independent mechanisms:
1. **Automatic** — `@media (prefers-color-scheme: dark)` applies dark tokens to `.gridix-wrapper[data-gridix-theme="default"]` and `.gridix-wrapper[data-gridix-theme="minimal"]`.
2. **Explicit** — `.gridix-wrapper[data-gridix-theme="dark"]` always uses dark tokens regardless of OS preference.

## TypeScript standards

`tsconfig.json` targets `ES2022`, lib `ES2022`, with `strict: true`, `noUncheckedIndexedAccess: true`, `useDefineForClassFields: true`. All source files must have explicit return types on exported functions.

Note: `@rollup/plugin-typescript` sets `declaration: false` internally, which makes `declarationMap` invalid. Do not add `declarationMap: true` to `tsconfig.json` — it causes a `TS5069` warning on every build.

## Tooling

| Tool | Config file | Notes |
|------|-------------|-------|
| Prettier | `.prettierrc.json` | `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100` |
| ESLint | `eslint.config.mjs` | ESLint 9 flat config, TypeScript rules |
| Stylelint | `.stylelintrc.json` | Extends `stylelint-config-standard`, `--gridix-*` custom prop pattern |
| Rollup | `rollup.config.mjs` | Uses `buildPair()` for unminified+sourcemap and minified pairs |
| lightningcss | `scripts/build-css.mjs` | Node.js API, `Features.Nesting` enabled |
| Vitest | `vitest.config.ts` | jsdom environment |
| Vite | `vite.demo.config.ts` | Demo dev server (project root) |

## Security

### XSS prevention
`highlightCells` in `features/filtering.ts` uses the DOM API exclusively (`createTextNode`, `element.textContent`). **Never use `innerHTML` with user-controlled input.** If you add any feature that renders user content, use the DOM API or `escapeHtml()` from `utils/dom.ts`.

### CSV injection prevention
`exportCSV` and `copyToClipboard` in `features/export.ts` prefix any cell value starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote `'`. This is the OWASP-recommended DDE prevention technique. Do not skip this prefix when adding export formats.

## ARIA and accessibility

The table uses the ARIA `role="grid"` pattern:
- `role="grid"` on `<table>`, `role="columnheader"` on `<th>`, `role="gridcell"` on `<td>`
- `aria-sort` on sortable headers: `"none"` → `"ascending"` → `"descending"`
- `aria-selected` on body rows when row-select is enabled
- `aria-rowcount` updated after every filter/search
- `aria-expanded` / `aria-haspopup` / `aria-controls` on dropdown trigger buttons
- `aria-current="page"` on the active pagination button
- Singleton `aria-live="polite"` region (via `announce()`) for dynamic announcements

Keyboard navigation uses the **roving tabindex** pattern — one cell at a time has `tabindex="0"`, arrow keys move it programmatically. `refreshTabindex()` must be called after every `render()`.

## Responsive width detection

`measureNaturalWidth(table)` temporarily sets `width:auto; table-layout:auto`, reads `table.scrollWidth`, then restores the previous styles. This lets the browser's own layout engine compute the true minimum content width. The result is applied as `min-width` on the scroll container. A `ResizeObserver` re-runs this on container resize.

## Row select + header index offset

`buildHeaders()` runs before `buildCheckboxCol()`. So `this.headers[0]` is always the first **data** column (e.g. "ID"), even though the DOM has a checkbox `<th>` prepended at index 0 after `buildCheckboxCol()` runs. When querying `<th>` elements in tests or DOM inspection, account for this offset: use `.gridix-th--sortable` selectors rather than positional `thead tr:first-child th` queries.

## Testing conventions

- Tests use Vitest + jsdom. Setup in `tests/setup.ts`.
- All test files use kebab-case names: `auto-init.test.ts`, `col-visibility.test.ts`, `data-parser.test.ts`, `gridix-table.extended.test.ts`, `keyboard-nav.test.ts`, `row-select.test.ts`, `width-detector.test.ts`.
- DOM is cleared with `document.body.innerHTML = ''` in `beforeEach`.
- When testing ARIA sort attributes with row-select enabled, query by `.gridix-th--sortable` not by DOM position.
- `announce()` uses a singleton `<div role="status">` appended to `<body>` — tests that check announcement text should look there.
- Import paths use kebab-case: `'../src/core/gridix-table'`, `'../src/core/auto-init'`, `'../src/features/row-select'`, etc.

## Framework connectors

`src/connectors/` contains four adapters. They do **not** import from React, Vue, Svelte, or Angular — they export helper functions and copy-paste templates. The Svelte connector (`svelte.ts`) exports a ready-to-use `gridix()` action. The others export helper factory functions plus code comments explaining how to wire them into your framework.
