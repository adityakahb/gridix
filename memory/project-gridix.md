---
name: project-gridix
description: Gridix CTS — DataTables alternative plugin. Architecture, build, naming conventions, and key decisions.
metadata:
  type: project
---

A fully-built AEM-compatible, TypeScript-first table plugin at `/Users/2377351/workspace/gridix-cts`.

**Key decisions / constraints:**
- "gridix" must never be abbreviated — not in class names, data attributes, CSS custom props, or JS identifiers. `col`, `px`, `dir` etc. are fine short forms.
- All public surface uses `data-gridix-*` (table) and `data-gridix-col-*` (th).
- CDN build (`src/cdn.ts` → `dist/gridix.cdn.min.js`) auto-inits `[data-gridix]` tables on DOMContentLoaded. ESM/CJS/UMD (`src/index.ts`) have no side effects — consumer must call `new Gridix(el)`.
- Smart responsive width: plugin measures each table's natural `scrollWidth` with `width:auto; table-layout:auto`, sets it as `min-width` on the table, outer div has `overflow-x:auto`. ResizeObserver re-measures on container resize. No fixed percentage widths.

**Build:** `npm run build` → Rollup (4 JS formats) + Sass CLI (gridix.css + gridix.min.css). No sourcemaps.

**Tests:** 75 unit tests across 7 files, Vitest + jsdom.

**Dev server:** `npm run dev` → Vite on port 3000, root is project root (NOT `demos/`). Demos live at `/demos/*.html`.

**Why:** `vite.demo.config.ts` must NOT set `root: 'demos'` — doing so makes `/src/...` paths resolve as `demos/src/...` which breaks CSS and JS loading silently.
