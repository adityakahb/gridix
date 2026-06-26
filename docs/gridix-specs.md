# Gridix — Specification Document

## Overview

A lightweight, TypeScript-first, AEM-compatible table plugin. Replaces DataTables with a dependency-free solution that reads configuration from HTML `data-` attributes (AEM author-friendly) and handles responsive width smartly — per table, not globally.

---

## 1. Features

| Feature | Details |
|---|---|
| Sorting | Multi-column (click header; shift+click for multi), asc/desc/none cycle |
| Global search | Debounced input, highlights matched text |
| Column search | Optional per-column filter row below header |
| Pagination | Configurable page size, page-size selector |
| Column visibility | Dropdown to toggle individual columns |
| Responsive width | Per-table natural-width detection (see §5) |
| Export | CSV, JSON; copy-to-clipboard |
| Row selection | Checkbox col, single/multi mode |
| Fixed header | Sticky `<thead>` on scroll inside container |
| Empty state | Configurable "no results" message |
| AEM auto-init | `[data-gridix]` scanned on `DOMContentLoaded` |
| Print support | `@media print` stylesheet removes controls and shows all rows |
| Dark mode | Auto via `prefers-color-scheme: dark`; explicit via `data-gridix-theme="dark"` |
| Framework connectors | React, Vue 3, Svelte, Angular adapters in `src/connectors/` |

---

## 2. AEM Data Attribute API

All options are expressible as `data-gridix-*` attributes on the `<table>` element so AEM dialog authors can control behaviour without writing JS.

```html
<table
  data-gridix

  data-gridix-search="true"
  data-gridix-search-placeholder="Search records…"

  data-gridix-pagination="true"
  data-gridix-page-length="10"
  data-gridix-page-length-menu="10,25,50,100"

  data-gridix-sort="true"
  data-gridix-sort-multi="true"

  data-gridix-col-visibility="true"

  data-gridix-export="csv,json,copy"

  data-gridix-row-select="multi"          <!-- false | single | multi -->

  data-gridix-fixed-header="true"
  data-gridix-fixed-header-offset="64"    <!-- px offset for sticky nav -->

  data-gridix-col-search="false"          <!-- per-col filter row -->

  data-gridix-empty-text="No records found."

  data-gridix-theme="default"             <!-- default | minimal | dark -->
>
  <thead>
    <tr>
      <!-- Per-col config via th data attributes -->
      <th data-gridix-col-type="number" data-gridix-col-width="80">ID</th>
      <th data-gridix-col-sortable="false">Avatar</th>
      <th data-gridix-col-visible="false">Internal Ref</th>
      <th data-gridix-col-class="u-text-right">Price</th>
    </tr>
  </thead>
  <tbody>…</tbody>
</table>
```

### Per-col `<th>` attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-gridix-col-type` | `string` `number` `date` | `string` | Controls sort comparison |
| `data-gridix-col-sortable` | `true` `false` | `true` | Disable sort on col |
| `data-gridix-col-searchable` | `true` `false` | `true` | Exclude from global search |
| `data-gridix-col-visible` | `true` `false` | `true` | Initial visibility |
| `data-gridix-col-width` | CSS value | — | Fixed width hint |
| `data-gridix-col-class` | class string | — | Extra class on every `<td>` |
| `data-gridix-col-no-export` | — | — | Presence flag; skip in exports |

---

## 3. JS / Programmatic API

```ts
// Manual init
import { Gridix } from 'gridix'

const gridix = new Gridix(tableElement, {
  search: true,
  pagination: { enabled: true, pageLength: 25, pageLengthMenu: [10, 25, 50] },
  sort: true,
  export: ['csv', 'json'],
})

// Methods
gridix.search('query')
gridix.goToPage(3)
gridix.sort(colIndex, 'asc')
gridix.showCol(colIndex)
gridix.hideCol(colIndex)
gridix.getSelectedRows()
gridix.destroy()

// Events (CustomEvent on the original <table> element)
table.addEventListener('gridix:sort',      (e) => { /* e.detail: { col, dir } */ })
table.addEventListener('gridix:page',      (e) => { /* e.detail: { page, total } */ })
table.addEventListener('gridix:rowselect', (e) => { /* e.detail: { rows }     */ })
```

---

## 4. Project Structure

```
gridix/
├── src/
│   ├── types.ts                         — All interfaces & enums
│   ├── constants.ts                     — Data attribute names, defaults, CSS class names
│   ├── index.ts                         — ESM/CJS/UMD entry (no side effects)
│   ├── cdn.ts                           — CDN IIFE entry (auto-init side effect)
│   ├── connectors/
│   │   ├── react.ts                     — React hook pattern + createGridix helper
│   │   ├── vue.ts                       — Vue 3 composable + vGridix directive pattern
│   │   ├── svelte.ts                    — Svelte action (use:gridix)
│   │   └── angular.ts                   — Angular directive pattern
│   ├── core/
│   │   ├── gridix-table.ts              — Main class — orchestrates all features
│   │   └── auto-init.ts                 — DOMContentLoaded scanner for [data-gridix]
│   ├── features/
│   │   ├── sorting.ts
│   │   ├── filtering.ts
│   │   ├── pagination.ts
│   │   ├── col-visibility.ts
│   │   ├── export.ts
│   │   ├── row-select.ts
│   │   └── keyboard-nav.ts
│   ├── utils/
│   │   ├── dom.ts                       — el() factory, on(), dispatch(), debounce()
│   │   ├── data-parser.ts               — Read <table> DOM into internal model
│   │   ├── width-detector.ts            — Smart per-table min-width measurement
│   │   └── announce.ts                  — Singleton aria-live region
│   └── styles/
│       ├── variables.css                — CSS custom properties at :root
│       ├── base.css                     — Wrapper, sr-only, scroll container
│       ├── table.css                    — Table, thead, tbody, sort indicators
│       ├── toolbar.css                  — Toolbar, search, col-vis, export dropdowns
│       ├── pagination.css               — Footer, page buttons
│       ├── themes.css                   — Minimal, dark, and auto dark-mode themes
│       ├── print.css                    — @media print styles
│       └── gridix.css                   — Entry — @imports all partials
├── tests/                               — Vitest test files (225 tests)
├── demos/
│   ├── index.html                       — Demo hub
│   ├── basic.html                       — 8-col employee table
│   ├── responsive.html                  — Natural-width per-table showcase
│   ├── aem.html                         — Pure data-attribute config
│   ├── advanced.html                    — Row select, fixed header, export
│   ├── themes.html                      — default / minimal / dark side by side
│   ├── print.html                       — Print-optimised output demo
│   └── lighthouse.html                  — Performance / accessibility demo
├── docs/
│   └── gridix-specs.md                  — This file
├── dist/
│   ├── scripts/                         — All JS outputs (min + unmin + sourcemaps)
│   ├── styles/                          — CSS outputs (min + unmin + sourcemap)
│   └── gridix.d.ts                      — TypeScript declarations
├── scripts/
│   └── build-css.mjs                    — lightningcss build script
├── src/connectors/                      — Framework adapters (shipped with package)
├── package.json
├── tsconfig.json
├── rollup.config.mjs
├── vitest.config.ts
├── vite.demo.config.ts
├── .prettierrc.json
├── eslint.config.mjs
└── .stylelintrc.json
```

---

## 5. Smart Responsive Width Strategy

### The Problem
A fixed percentage (e.g., `min-width: 150%`) applies the same rule to every table. A dense-col table may need 200% minimum width for readability, while a sparse table at 150% creates excessive whitespace or wrapping.

### Solution: Natural-Width Measurement

Each table is measured **independently** using the browser's own layout engine:

```
Step 1 — Temporarily set table to width:auto; table-layout:auto
Step 2 — Read table.scrollWidth  →  that IS the minimum content-fit width
Step 3 — Restore original styles
Step 4 — Apply width as min-width on the <table> element
Step 5 — Outer .gridix-scroll container: overflow-x: auto
```

A `ResizeObserver` re-runs the measurement on container resize.

---

## 6. Build System

**Toolchain**: Rollup + TypeScript plugin + Terser (JS) | lightningcss (CSS)

### Output files (`dist/`)

| File | Format | Minified | Sourcemap | Use case |
|---|---|---|---|---|
| `scripts/gridix.esm.js` | ES Module | No | Yes | Bundlers (Vite, Webpack) — debug |
| `scripts/gridix.esm.min.js` | ES Module | Yes | No | Bundlers — production |
| `scripts/gridix.cjs.js` | CommonJS | No | Yes | Node / older bundlers — debug |
| `scripts/gridix.cjs.min.js` | CommonJS | Yes | No | Node / older bundlers — production |
| `scripts/gridix.umd.js` | UMD | No | Yes | RequireJS — debug |
| `scripts/gridix.umd.min.js` | UMD | Yes | No | RequireJS — production |
| `scripts/gridix.cdn.js` | IIFE | No | Yes | Script tag — debug |
| `scripts/gridix.cdn.min.js` | IIFE | Yes | No | Script tag / CDN — production |
| `styles/gridix.css` | CSS | No | Yes | Raw stylesheet |
| `styles/gridix.min.css` | CSS | Yes | No | Production stylesheet |
| `gridix.d.ts` | TypeScript | — | — | Type declarations |

### npm scripts

```json
"build":      "rollup -c && node scripts/build-css.mjs",
"build:js":   "rollup -c rollup.config.mjs",
"build:css":  "node scripts/build-css.mjs",
"dev":        "vite --config vite.demo.config.ts",
"test":       "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"format":     "prettier --write ...",
"lint":       "eslint src tests",
"lint:css":   "stylelint src/styles/**/*.css",
"clean":      "rimraf dist"
```

---

## 7. CSS Architecture

All CSS uses modern features — no SASS / preprocessors. Source files use native CSS nesting and `@import`, processed by lightningcss at build time.

### Design tokens (`variables.css`)

All custom properties are declared at `:root` (global, overridable by consumers):

```css
:root {
  --gridix-font-size: 0.875rem;
  --gridix-color-text: #1e293b;
  --gridix-color-bg: #ffffff;
  --gridix-color-accent: #3b82f6;
  --gridix-radius: 6px;
  --gridix-cell-px: 12px;
  --gridix-cell-py: 10px;
  --gridix-breakpoint-desktop: 1280px; /* reference only — cannot be used in @media */
}
```

### Mobile-first layout

Default styles are for narrow (mobile) viewports. Desktop layout is behind `@media (min-width: 1280px)`. The breakpoint value (`1280px`) is documented in `--gridix-breakpoint-desktop` for JS consumers.

### Theming

- `data-gridix-theme="default"` — light theme + auto dark via `prefers-color-scheme: dark`
- `data-gridix-theme="minimal"` — borderless variant + auto dark
- `data-gridix-theme="dark"` — always dark, regardless of system setting

---

## 8. TypeScript Standards

- **Target**: `ES2022` — enables class fields, `Object.hasOwn()`, `Array.at()`, private `#fields`
- **Lib**: `ES2022, DOM, DOM.Iterable`
- **Strict mode**: `strict: true`, `noUncheckedIndexedAccess: true`
- **Module resolution**: `bundler` (Vite / Rollup optimised)

---

## 9. Testing Strategy

**Framework**: Vitest + jsdom environment | 225 tests across 14 files

| Module | Tests |
|---|---|
| `data-parser` | parse thead/tbody, col type inference, data-attr reading |
| `sorting` | asc/desc/none cycle, number vs string vs date sort, multi-col |
| `filtering` | global search match, case-insensitive, highlight, XSS prevention |
| `pagination` | page calc, boundary pages, page-size change |
| `col-visibility` | hide/show, export exclusion |
| `width-detector` | fallback when `scrollWidth=0` (jsdom), ResizeObserver mock |
| `core` | init from DOM, init from options, destroy cleans up |
| `dom` | el() factory, attribute setting, dispatch() |
| `export` | CSV format, JSON format, clipboard copy, CSV injection prevention |
| `row-select` | single/multi mode, checkbox state, aria-selected |
| `keyboard-nav` | roving tabindex init, arrow-key movement, Home/End/Ctrl combos |
| `accessibility` | ARIA roles, aria-sort, live region announcements, focus management |
| `autoInit` | DOMContentLoaded scanner, multi-table init |
| `gridixTable.extended` | integration across features, edge cases |

---

## 10. Framework Connectors

Connector source files live in `src/connectors/` and are included in the npm package under `src/connectors/`. They do not import from their respective frameworks — they provide copy-paste templates and framework-agnostic helpers.

| File | Pattern |
|---|---|
| `react.ts` | `createGridix()` helper + `useGridix` hook template |
| `vue.ts` | `mountGridix()` helper + `useGridix` composable + `vGridix` directive template |
| `svelte.ts` | `gridix()` Svelte action (ready to use with `use:gridix`) |
| `angular.ts` | `createGridixController()` + Angular `GridixDirective` template |

---

## 11. Real-World Production Problems & Solutions

### 11.1 Accessibility (WCAG 2.1 AA)

| Problem | Root cause | Gridix solution |
|---|---|---|
| Screen readers announce sort as generic "button" | No `aria-sort` on `<th>` | Set `aria-sort="none|ascending|descending"` on every sortable header |
| Search/filter results are silent | DOM change is visual-only | `aria-live="polite"` region announces "X entries found" |
| Pagination buttons read as "«", "‹" | Icon-only buttons | Each button gets a descriptive `aria-label` |
| Column-vis/export dropdowns have no state | Missing `aria-expanded` | Buttons carry `aria-expanded` and `aria-haspopup="menu"` |
| Row selection invisible to screen readers | No semantic selected state | `aria-selected="true/false"` on every `<tr>` |
| Paginated rows lose positional context | Missing `aria-rowindex` | Set `aria-rowindex` on each visible `<tr>` |
| Table purpose unclear | No `<caption>` or label | `aria-label` from caption, `data-gridix-label`, or preceding heading |

### 11.2 Keyboard Navigation

ARIA `role="grid"` interaction pattern with roving tabindex:
- `ArrowRight/Left/Up/Down` — move between cells
- `Home/End` — first/last cell in row; `Ctrl+Home/End` — first/last overall
- `PageDown/PageUp` — jump 5 rows
- `Tab` — exits grid to normal tab flow

### 11.3 Performance — Large Datasets

| Technique | Benefit |
|---|---|
| `DocumentFragment` for row reordering | Avoids repeated reflow |
| Debounced search (200 ms) | Prevents per-keystroke full re-render |
| Rows kept in memory, not re-parsed | DOM nodes reused — only `display` toggled |

### 11.4 Security

**XSS Prevention** — `highlightCells()` uses DOM API exclusively (`createTextNode`, `mark.textContent`). No `innerHTML` is ever used with user-controlled input.

**CSV Formula Injection** — `sanitizeCsvValue()` prefixes dangerous values (`=+−@\t\r`) with `'` to prevent spreadsheet DDE execution.

**Input Validation** — `fixedHeaderOffset` is clamped to `[0, 1000]` px.

### 11.5 Touch & Mobile UX

- Touch targets: minimum 44×44 px on `@media (pointer: coarse)` (WCAG 2.5.5)
- Sort tap vs scroll: fires on `touchend` only if drift ≤ 4 px
- `overflow-anchor: none` prevents scroll jumps on row toggling

### 11.6 Colour Contrast

- Body text `#1e293b` on `#fff` → **15.8:1** ✓
- Muted text `#64748b` on `#fff` → **4.6:1** ✓
- Highlight: `#fef08a` bg / `#713f12` text → **7.2:1** ✓

### 11.7 Reduced Motion

All `transition` declarations wrapped in `@media (prefers-reduced-motion: no-preference)`.

### 11.8 RTL Support

All directional CSS uses logical properties: `margin-inline-start`, `inset-inline-end`, `padding-inline`, `text-align: start`.

### 11.9 Windows High Contrast Mode

Sort indicators and highlight marks include `@media (forced-colors: active)` blocks using `ButtonText`, `Mark`, and `MarkText` system color keywords.

---

## 12. Implementation Order (completed)

1. `package.json`, `tsconfig.json`, `rollup.config.mjs`, `vitest.config.ts`
2. `src/types.ts`, `src/constants.ts`
3. `src/utils/dom.ts`, `src/utils/data-parser.ts`, `src/utils/width-detector.ts`
4. `src/features/sorting.ts`, `filtering.ts`, `pagination.ts`, `col-visibility.ts`, `export.ts`, `row-select.ts`, `keyboard-nav.ts`
5. `src/core/gridix-table.ts`, `src/core/auto-init.ts`
6. `src/index.ts`, `src/cdn.ts`
7. `src/styles/*.css` — modern CSS replacing SASS
8. `src/connectors/react.ts`, `vue.ts`, `svelte.ts`, `angular.ts`
9. `tests/` — 225 tests across 14 files
10. `demos/` — 7 demo HTML files
11. `docs/gridix-specs.md` — this document
12. Tooling: Prettier, ESLint, Stylelint configs
