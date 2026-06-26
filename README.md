# Gridix

A TypeScript-first, AEM-compatible alternative to DataTables. Every feature is configurable through `data-gridix-*` HTML attributes — no JavaScript required from the page author.

## Features

- Sorting (single and multi-column)
- Global search and per-column search filters
- Pagination with configurable page lengths
- Row selection (single and multi)
- Column visibility toggle
- CSV, JSON, and copy-to-clipboard export
- Smart responsive widths — each table independently measures its own natural content width
- Three built-in themes (default, minimal, dark) overridable with CSS custom properties
- Automatic dark mode via `prefers-color-scheme: dark`
- Print-optimised stylesheet (toolbar and pagination hidden; all rows shown)
- Full ARIA grid accessibility — `role="grid"`, `aria-sort`, `aria-selected`, `aria-rowindex`, keyboard navigation, Windows High Contrast Mode support
- Mobile-first layout with 1280 px desktop breakpoint
- AEM CDN drop-in build that auto-initialises all `[data-gridix]` tables on `DOMContentLoaded`
- Framework connectors for React, Vue 3, Svelte, and Angular (in `src/connectors/`)
- `"sideEffects": false` — ESM/CJS builds are fully tree-shakeable

---

## Quick start

### CDN (AEM / no build step)

```html
<link rel="stylesheet" href="dist/styles/gridix.min.css">
<script src="dist/scripts/gridix.cdn.min.js"></script>

<table data-gridix data-gridix-sort="true" data-gridix-search="true">
  <thead><tr><th>Name</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>Alice</td><td>Engineer</td></tr>
    <tr><td>Bob</td><td>Manager</td></tr>
  </tbody>
</table>
```

The CDN build scans for every `[data-gridix]` table and initialises it automatically.

#### Script loading: defer vs async

**`defer` (recommended for page-bottom or `<head>` placement)**

```html
<script src="dist/scripts/gridix.cdn.min.js" defer></script>
```

- Script downloads in parallel with HTML parsing and executes _after_ the document is fully parsed but _before_ `DOMContentLoaded`.
- Gridix's CDN build listens for `DOMContentLoaded`, so `defer` is a natural fit — the script fires at exactly the right moment with zero extra configuration.

**`async` (fire-and-forget; use only if the table HTML is guaranteed to be ready)**

```html
<script src="dist/scripts/gridix.cdn.min.js" async></script>
```

- Script downloads in parallel and executes _as soon as it downloads_, which may be before or after the DOM is ready.
- The CDN build guards against this: if `document.readyState !== 'loading'` when the script executes it calls `autoInit()` immediately; otherwise it still waits for `DOMContentLoaded`.
- Prefer `defer` unless you are embedding the script at the very end of `<body>` and know the table markup precedes it.

**`type="module"` (ESM — automatically deferred)**

```html
<script type="module">
  import { GridixTable } from './dist/scripts/gridix.esm.js';
  const table = document.querySelector('[data-gridix]');
  if (table) new GridixTable(table);
</script>
```

- Module scripts are always deferred by the browser specification — no `defer` attribute is needed.
- Best choice when targeting modern browsers and you want to import only the features you use (tree-shaking).

### ESM / npm

```ts
import { GridixTable as Gridix } from 'gridix';
import 'gridix/style';

const table = document.querySelector('table')!;
new Gridix(table);
```

### Programmatic API

```ts
const gridix = new Gridix(table, {
  sort: true,
  search: true,
  pagination: { enabled: true, pageLength: 10, pageLengthMenu: [10, 25, 50] },
  rowSelect: 'multi',
  colVisibility: true,
  export: ['csv', 'json'],
});

// Public methods
gridix.sort(colIndex, 'asc' | 'desc' | 'none');
gridix.search(query);
gridix.showCol(colIndex);
gridix.hideCol(colIndex);
gridix.goToPage(pageIndex);       // 0-based
gridix.getSelectedRows();         // returns array of original row indices
gridix.destroy();
```

---

## Framework connectors

Adapters live in `src/connectors/` and are included in the npm package. They provide framework-idiomatic wrappers around `GridixTable` without importing from the frameworks themselves. Copy the template into your project.

### React

```tsx
import { useRef, useEffect, useState } from 'react';
import { GridixTable } from 'gridix';
import type { GridixOptions } from 'gridix';

function useGridix(ref: React.RefObject<HTMLTableElement>, options?: Partial<GridixOptions>) {
  const [instance, setInstance] = useState<GridixTable | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const grid = new GridixTable(ref.current, options);
    setInstance(grid);
    return () => { grid.destroy(); setInstance(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]);
  return instance;
}
```

### Vue 3

```ts
// composables/use-gridix.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { GridixTable } from 'gridix';

export function useGridix(tableRef: Ref<HTMLTableElement | null>, options?: object) {
  const instance = ref<GridixTable | null>(null);
  onMounted(() => { if (tableRef.value) instance.value = new GridixTable(tableRef.value, options); });
  onUnmounted(() => { instance.value?.destroy(); });
  return instance;
}
```

### Svelte

```svelte
<script lang="ts">
  import { gridix } from 'gridix/connectors/svelte';
</script>
<table use:gridix={{ sort: true }}>…</table>
```

### Angular

```ts
@Directive({ selector: '[gridix]', standalone: true })
export class GridixDirective implements OnInit, OnDestroy {
  @Input() gridix?: Partial<GridixOptions>;
  constructor(private el: ElementRef<HTMLTableElement>) {}
  private instance?: GridixTable;
  ngOnInit() { this.instance = new GridixTable(this.el.nativeElement, this.gridix); }
  ngOnDestroy() { this.instance?.destroy(); }
}
```

---

## Data attributes reference

### Table-level (`<table>`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-gridix` | flag | — | Marks the table for auto-init (CDN build) |
| `data-gridix-sort` | boolean | `true` | Enable column sorting |
| `data-gridix-sort-multi` | boolean | `false` | Allow multi-column sort (Shift+click) |
| `data-gridix-search` | boolean | `true` | Enable global search input |
| `data-gridix-search-placeholder` | string | `"Search…"` | Search input placeholder |
| `data-gridix-col-search` | boolean | `false` | Show per-column filter inputs below the header |
| `data-gridix-pagination` | boolean | `true` | Enable pagination |
| `data-gridix-page-length` | number | `10` | Rows per page |
| `data-gridix-page-length-menu` | string | `"10,25,50,100"` | Comma-separated page length options |
| `data-gridix-row-select` | `"single"` \| `"multi"` | — | Enable row selection |
| `data-gridix-col-visibility` | boolean | `false` | Show column visibility toggle button |
| `data-gridix-export` | string | — | Comma-separated formats: `csv`, `json`, `copy` |
| `data-gridix-empty-text` | string | `"No entries found"` | Message shown when no rows match |
| `data-gridix-theme` | `"default"` \| `"minimal"` \| `"dark"` | `"default"` | Visual theme |
| `data-gridix-label` | string | `"Data table"` | `aria-label` value on the table element |
| `data-gridix-fixed-header` | boolean | `false` | Stick `<thead>` to top of scroll container |
| `data-gridix-fixed-header-offset` | number | `0` | Top offset (px) for fixed header — useful with a sticky nav |

### Column-level (`<th>`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-gridix-col-type` | `"string"` \| `"number"` \| `"date"` | `"string"` | Sort and compare strategy |
| `data-gridix-col-sortable` | boolean | `true` | Whether this column can be sorted |
| `data-gridix-col-searchable` | boolean | `true` | Whether this column is included in search |
| `data-gridix-col-visible` | boolean | `true` | Whether this column is visible on load |
| `data-gridix-col-width` | string | — | Fixed column width (e.g. `"120px"`, `"10%"`) |
| `data-gridix-col-class` | string | — | Extra CSS class on every `<td>` in this column |
| `data-gridix-col-no-export` | flag | — | Exclude this column from CSV/JSON/copy exports |

---

## Themes and CSS custom properties

The `default` and `minimal` themes automatically switch to dark colours when the user's OS is in dark mode (`prefers-color-scheme: dark`). To force dark mode explicitly set `data-gridix-theme="dark"`.

Override any token with a CSS custom property on a parent element — no recompile needed:

```html
<div style="--gridix-color-accent: #8b5cf6;">
  <table data-gridix data-gridix-theme="default">…</table>
</div>
```

Full list of custom properties:

| Property | Purpose |
|----------|---------|
| `--gridix-color-accent` | Buttons, active states, focus rings |
| `--gridix-color-bg` | Cell / toolbar background |
| `--gridix-color-header-bg` | `<thead>` row background |
| `--gridix-color-border` | Table and control borders |
| `--gridix-color-text` | Primary text |
| `--gridix-color-text-muted` | Secondary / placeholder text |
| `--gridix-color-hover-bg` | Row hover and button hover |
| `--gridix-color-stripe-bg` | Alternating row stripe |
| `--gridix-color-selected-bg` | Selected row background |
| `--gridix-color-highlight-bg` | Search match highlight background |
| `--gridix-color-highlight-text` | Search match highlight text colour |
| `--gridix-font-size` | Base font size |
| `--gridix-radius` | Border radius on controls |
| `--gridix-breakpoint-desktop` | Desktop breakpoint reference value (1280 px — JS only) |

---

## Print support

Include `dist/styles/gridix.css` (which embeds print styles). When the user prints:

- Toolbar, pagination, and export controls are hidden
- All rows are shown (pagination bypassed)
- Table borders are forced visible
- Colors are reset to black on white

See `demos/print.html` for a live example.

---

## Keyboard navigation

| Key | Action |
|-----|--------|
| `↑` `↓` `←` `→` | Move focus between cells |
| `Home` / `End` | First / last cell in current row |
| `Ctrl+Home` / `Ctrl+End` | First / last cell in entire table |
| `PgUp` / `PgDn` | Jump 5 rows up / down |
| `Tab` | Move between toolbar controls and the table |
| `Shift+click` header | Add secondary sort column |
| `Esc` | Close open dropdown, return focus to its trigger |

---

## Events

All events bubble from the `<table>` element.

| Event | `detail` | Fired when |
|-------|----------|-----------|
| `gridix:sort` | `{ col: number, dir: string }` | Sort state changes |
| `gridix:page` | `{ page: number, total: number }` | Page changes |
| `gridix:rowselect` | `{ rows: number[] }` | Row selection changes |

```js
table.addEventListener('gridix:sort', e => {
  console.log(e.detail); // { col: 0, dir: 'asc' }
});
```

---

## Security

### Search highlighting — no innerHTML

`highlightCells` uses the DOM API exclusively (`createTextNode`, `element.textContent`). No `innerHTML` is used with user-controlled input, so angle brackets and HTML-special characters in cell content cannot be exploited for script injection.

### CSV / clipboard — formula injection prevention

Any cell value starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is prefixed with `'` before export. All major spreadsheet applications treat this as a "force literal string" marker, preventing DDE execution.

Reference: [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)

---

## Project structure

```
src/
  index.ts            ESM/CJS/UMD entry — no side effects, fully tree-shakeable
  cdn.ts              IIFE CDN entry — auto-init side effect on DOMContentLoaded
  types.ts            TypeScript interfaces and enums
  constants.ts        ATTR (data attribute names), CSS class names, DEFAULTS
  connectors/
    react.ts          React hook pattern + createGridix helper
    vue.ts            Vue 3 composable + vGridix directive template
    svelte.ts         Svelte action (use:gridix)
    angular.ts        Angular directive template + createGridixController()
  core/
    gridix-table.ts   Main class — wires all features together
    auto-init.ts      autoInit() — DOMContentLoaded scanner
  features/
    sorting.ts        Multi-column sort logic and aria-sort updates
    filtering.ts      Debounced search, highlight, XSS-safe DOM manipulation
    pagination.ts     Page slicing, window calculation
    row-select.ts     Checkbox row selection, aria-selected sync
    col-visibility.ts Show/hide columns, export exclusion
    export.ts         CSV, JSON, clipboard; CSV injection prevention
    keyboard-nav.ts   Roving tabindex, arrow-key ARIA grid navigation
  utils/
    dom.ts            el() factory, on(), dispatch(), debounce(), escapeHtml()
    data-parser.ts    data-gridix-* attribute parsing helpers
    width-detector.ts Natural per-table min-width measurement via ResizeObserver
    announce.ts       Singleton aria-live polite region
  styles/
    variables.css     CSS custom properties declared at :root
    base.css          .gridix-wrapper, .gridix-sr-only, .gridix-scroll
    table.css         Table, thead, tbody, sort indicators, highlights
    toolbar.css       Search input, col-vis, export dropdowns (mobile-first)
    pagination.css    Footer, page buttons (mobile-first, 1280 px desktop)
    themes.css        Minimal, dark, and @media prefers-color-scheme: dark
    print.css         @media print — hide controls, show all rows
    gridix.css        Entry point — @imports all partials

tests/               225 Vitest + jsdom tests across 14 files
demos/               7 HTML demo pages (run via Vite dev server)
  index.html         Hub / navigation
  basic.html         All features via data attributes
  responsive.html    Per-table natural-width showcase
  aem.html           CDN auto-init, pure data-attribute configuration
  advanced.html      Row select, sticky header, multi-sort
  themes.html        default / minimal / dark side by side
  print.html         Print-optimised output demo
  lighthouse.html    Performance / accessibility optimised demo
docs/
  gridix-specs.md    Full specification, implementation plan, real-world problem solutions
dist/
  scripts/           All JS outputs (unminified + sourcemap, minified)
  styles/            CSS outputs (unminified + sourcemap, minified)
  gridix.d.ts        TypeScript declarations
scripts/
  build-css.mjs      lightningcss build script (bundles @imports, minifies)
```

---

## Development

### Prerequisites

Node 18+, npm 9+.

```bash
npm install
```

### Commands

```bash
npm run dev              # Vite dev server → http://localhost:3000/demos/index.html
npm run build            # Build all JS + CSS outputs
npm run build:js         # JS only (Rollup)
npm run build:css        # CSS only (lightningcss via scripts/build-css.mjs)
npm test                 # Run all 225 tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report in coverage/
npm run format           # Prettier — format all source files
npm run format:check     # Prettier — check without writing
npm run lint             # ESLint — lint src/ and tests/
npm run lint:css         # Stylelint — lint src/styles/
npm run clean            # Remove dist/
```

### Build outputs

| File | Format | Minified | Sourcemap |
|------|--------|----------|-----------|
| `dist/scripts/gridix.esm.js` | ESM | No | Yes |
| `dist/scripts/gridix.esm.min.js` | ESM | Yes | No |
| `dist/scripts/gridix.cjs.js` | CJS | No | Yes |
| `dist/scripts/gridix.cjs.min.js` | CJS | Yes | No |
| `dist/scripts/gridix.umd.js` | UMD | No | Yes |
| `dist/scripts/gridix.umd.min.js` | UMD | Yes | No |
| `dist/scripts/gridix.cdn.js` | IIFE | No | Yes |
| `dist/scripts/gridix.cdn.min.js` | IIFE | Yes | No |
| `dist/styles/gridix.css` | CSS | No | Yes |
| `dist/styles/gridix.min.css` | CSS | Yes | No |
| `dist/gridix.d.ts` | TypeScript | — | — |

### Tooling

| Tool | Config file | Purpose |
|------|-------------|---------|
| Prettier | `.prettierrc.json` | Code formatting |
| ESLint | `eslint.config.mjs` | TypeScript linting |
| Stylelint | `.stylelintrc.json` | CSS linting |
| Rollup | `rollup.config.mjs` | JS bundling |
| lightningcss | `scripts/build-css.mjs` | CSS bundling and minification |
| Vitest | `vitest.config.ts` | Unit testing |
| Vite | `vite.demo.config.ts` | Demo dev server |

### Adding a new data attribute

1. Add the attribute name string to `ATTR` in `src/constants.ts`
2. Add the corresponding option field to `GridixOptions` in `src/types.ts`
3. Parse it in `src/utils/data-parser.ts` and wire into `src/core/gridix-table.ts`
4. Add a default value to `DEFAULTS` in `src/constants.ts`
5. Write a test in the relevant `tests/*.test.ts` file

---

## Publishing

Checklists for publishing and deploying Gridix are in the `docs/` directory:

- [`docs/npm-publish-checklist.md`](docs/npm-publish-checklist.md) — publish to npm
- [`docs/github-pages-checklist.md`](docs/github-pages-checklist.md) — deploy demo site to GitHub Pages
- [`docs/jsdelivr-skypack-checklist.md`](docs/jsdelivr-skypack-checklist.md) — distribute via jsDelivr, Skypack / esm.sh, and unpkg
