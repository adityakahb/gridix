import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const banner = `/*! Gridix v1.0.0 | MIT License | https://github.com/gridix */`;

/** Shared plugins for every JS build (without terser — added per-output). */
const sharedPlugins = [
  resolve(),
  typescript({ tsconfig: './tsconfig.json', declaration: false }),
];

/**
 * Produces an unminified build with an inline sourcemap reference
 * and a minified build without a sourcemap.
 *
 * @param {string} input - Entry file path.
 * @param {string} name - Output file base name (without extension).
 * @param {'es'|'cjs'|'umd'|'iife'} format - Rollup output format.
 * @param {string} [globalName] - Global variable name for UMD/IIFE builds.
 * @returns {import('rollup').RollupOptions[]} Two Rollup configs.
 */
function buildPair(input, name, format, globalName) {
  /** @type {import('rollup').OutputOptions} */
  const sharedOutput = {
    format,
    banner,
    ...(globalName ? { name: globalName, exports: 'named' } : {}),
  };

  return [
    // Unminified — includes sourcemap for debugging
    {
      input,
      output: { ...sharedOutput, file: `dist/scripts/${name}.js`, sourcemap: true },
      plugins: [...sharedPlugins],
    },
    // Minified — no sourcemap (production use)
    {
      input,
      output: { ...sharedOutput, file: `dist/scripts/${name}.min.js`, sourcemap: false },
      plugins: [...sharedPlugins, terser({ format: { comments: /^!/ } })],
    },
  ];
}

export default [
  // ESM — tree-shakeable, bundler-friendly
  ...buildPair('src/index.ts', 'gridix.esm', 'es'),
  // CJS — Node.js / older toolchains
  ...buildPair('src/index.ts', 'gridix.cjs', 'cjs'),
  // UMD — RequireJS / mixed environments
  ...buildPair('src/index.ts', 'gridix.umd', 'umd', 'Gridix'),
  // CDN IIFE — auto-initialises [data-gridix] tables on DOMContentLoaded
  ...buildPair('src/cdn.ts', 'gridix.cdn', 'iife', 'Gridix'),
  // TypeScript declarations — placed directly in dist/
  {
    input: 'src/index.ts',
    output: { file: 'dist/gridix.d.ts', format: 'es' },
    plugins: [dts()],
  },
];
