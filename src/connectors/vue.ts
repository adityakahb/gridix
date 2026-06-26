/**
 * Gridix Vue 3 connector.
 *
 * Provides a `useGridix` composable for Vue 3 Composition API and a
 * `vGridix` custom directive for template-based usage.
 *
 * This file does not import from Vue — it describes the integration patterns
 * and provides a framework-agnostic helper. Copy the code snippets below into
 * your Vue 3 project alongside the Gridix package.
 *
 * @example
 * ```vue
 * <!-- Using the directive -->
 * <template>
 *   <table v-gridix="{ sort: true, pagination: { enabled: true, pageLength: 10, pageLengthMenu: [10, 25] } }">
 *     <thead>…</thead>
 *     <tbody>…</tbody>
 *   </table>
 * </template>
 *
 * <script setup lang="ts">
 * import { vGridix } from './gridix-vue';
 * </script>
 * ```
 *
 * @module gridix/connectors/vue
 */

import { GridixTable } from '../core/gridix-table';
import type { GridixOptions } from '../types';

/**
 * Copy-paste template: Vue 3 composable for use in `<script setup>`.
 *
 * ```ts
 * // composables/use-gridix.ts
 * import { ref, onMounted, onUnmounted, Ref } from 'vue';
 * import { GridixTable } from 'gridix';
 * import type { GridixOptions } from 'gridix';
 *
 * export function useGridix(
 *   tableRef: Ref<HTMLTableElement | null>,
 *   options?: Partial<GridixOptions>,
 * ) {
 *   const instance = ref<GridixTable | null>(null);
 *
 *   onMounted(() => {
 *     if (!tableRef.value) return;
 *     instance.value = new GridixTable(tableRef.value, options);
 *   });
 *
 *   onUnmounted(() => {
 *     instance.value?.destroy();
 *     instance.value = null;
 *   });
 *
 *   return instance;
 * }
 * ```
 *
 * Copy-paste template: Vue 3 custom directive (`v-gridix`).
 *
 * ```ts
 * // directives/gridix.ts
 * import { Directive } from 'vue';
 * import { GridixTable } from 'gridix';
 * import type { GridixOptions } from 'gridix';
 *
 * const instances = new WeakMap<HTMLElement, GridixTable>();
 *
 * export const vGridix: Directive<HTMLTableElement, Partial<GridixOptions>> = {
 *   mounted(el, binding) {
 *     instances.set(el, new GridixTable(el, binding.value));
 *   },
 *   updated(el, binding) {
 *     instances.get(el)?.destroy();
 *     instances.set(el, new GridixTable(el, binding.value));
 *   },
 *   unmounted(el) {
 *     instances.get(el)?.destroy();
 *     instances.delete(el);
 *   },
 * };
 * ```
 */

/**
 * Framework-agnostic helper used by both the Vue composable and directive.
 * Initialises `GridixTable` and returns the instance plus a teardown function.
 *
 * @param tableEl - The `<table>` element to initialise.
 * @param options - Gridix options (optional; data attributes take precedence).
 * @returns The `GridixTable` instance.
 */
export function mountGridix(
  tableEl: HTMLTableElement,
  options?: Partial<GridixOptions>,
): GridixTable {
  return new GridixTable(tableEl, options);
}
