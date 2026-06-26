/**
 * Gridix Angular connector.
 *
 * Provides an Angular directive pattern for integrating Gridix into Angular 14+
 * applications. This file does not import from Angular — copy the directive
 * below into your Angular project.
 *
 * @example
 * ```ts
 * // gridix.directive.ts
 * import { Directive, Input, ElementRef, OnInit, OnDestroy, OnChanges } from '@angular/core';
 * import { GridixTable } from 'gridix';
 * import type { GridixOptions } from 'gridix';
 *
 * @Directive({ selector: '[gridix]', standalone: true })
 * export class GridixDirective implements OnInit, OnDestroy, OnChanges {
 *   @Input() gridix?: Partial<GridixOptions>;
 *
 *   private instance?: GridixTable;
 *
 *   constructor(private el: ElementRef<HTMLTableElement>) {}
 *
 *   ngOnInit(): void {
 *     this.instance = new GridixTable(this.el.nativeElement, this.gridix);
 *   }
 *
 *   ngOnChanges(): void {
 *     this.instance?.destroy();
 *     this.instance = new GridixTable(this.el.nativeElement, this.gridix);
 *   }
 *
 *   ngOnDestroy(): void {
 *     this.instance?.destroy();
 *   }
 * }
 * ```
 *
 * Then use it in a component template:
 * ```html
 * <table [gridix]="{ sort: true, pagination: { enabled: true, pageLength: 10, pageLengthMenu: [10, 25] } }">
 *   <thead>…</thead>
 *   <tbody>…</tbody>
 * </table>
 * ```
 *
 * @module gridix/connectors/angular
 */

import { GridixTable } from '../core/gridix-table';
import type { GridixOptions } from '../types';

/**
 * Lifecycle interface for Angular directive integration.
 * Describes the minimum contract a host directive must implement.
 */
export interface GridixDirectiveHost {
  /** The `<table>` element managed by this directive instance. */
  readonly tableEl: HTMLTableElement;
  /** Current Gridix options. */
  readonly options: Partial<GridixOptions> | undefined;
  /** Called on init — creates the GridixTable. */
  onInit(): void;
  /** Called when inputs change — destroys and recreates. */
  onChange(): void;
  /** Called on destroy — disposes the GridixTable. */
  onDestroy(): void;
}

/**
 * Factory that creates an Angular-directive-compatible controller for a
 * `<table>` element. Useful for testing or for non-Angular hosts that need
 * the same lifecycle pattern.
 *
 * @param tableEl - The `<table>` element to manage.
 * @param options - Initial Gridix options (optional).
 * @returns A controller object with `update` and `destroy` methods.
 */
export function createGridixController(
  tableEl: HTMLTableElement,
  options?: Partial<GridixOptions>,
): { instance: GridixTable; update(opts?: Partial<GridixOptions>): void; destroy(): void } {
  let instance = new GridixTable(tableEl, options);

  return {
    instance,
    update(opts?: Partial<GridixOptions>): void {
      instance.destroy();
      instance = new GridixTable(tableEl, opts);
    },
    destroy(): void {
      instance.destroy();
    },
  };
}
