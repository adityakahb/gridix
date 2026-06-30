/**
 * CSS build script using the lightningcss Node.js API.
 *
 * Produces two outputs from src/styles/gridix.css:
 *   dist/styles/gridix.css      — unminified, with external sourcemap
 *   dist/styles/gridix.min.css  — minified, no sourcemap
 *
 * Uses lightningcss for:
 *   - @import bundling
 *   - CSS nesting transformation (for browser compatibility)
 *   - Autoprefixer-style vendor prefix injection
 *   - Minification
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { bundle, Features } from 'lightningcss';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const inputFile = join(root, 'src/styles/gridix.css');
const outDir = join(root, 'dist/styles');

mkdirSync(outDir, { recursive: true });

/** Targets supporting CSS nesting natively (modern browsers only). */
const targets = {
  chrome: 112 << 16,
  firefox: 117 << 16,
  safari: (16 << 16) | (5 << 8),
};

// ── Unminified with sourcemap ─────────────────────────────────────────────

const { code: unminCode, map: unminMap } = bundle({
  filename: inputFile,
  minify: false,
  sourceMap: true,
  targets,
  include: Features.Nesting,
});

const cssStr = unminCode.toString();
const mapStr = unminMap?.toString() ?? '';
const outCss = join(outDir, 'gridix.css');
const outMap = join(outDir, 'gridix.css.map');

const banner = '/* Gridix v1.0.0 — https://github.com/adityakahb/gridix */\n';
writeFileSync(outCss, banner + cssStr + `\n/*# sourceMappingURL=gridix.css.map */\n`);
writeFileSync(outMap, mapStr);
console.log(`  ✓ dist/styles/gridix.css (+ .map)`);

// ── Minified without sourcemap ────────────────────────────────────────────

const { code: minCode } = bundle({
  filename: inputFile,
  minify: true,
  sourceMap: false,
  targets,
  include: Features.Nesting,
});

writeFileSync(join(outDir, 'gridix.min.css'), minCode.toString());
console.log(`  ✓ dist/styles/gridix.min.css`);
