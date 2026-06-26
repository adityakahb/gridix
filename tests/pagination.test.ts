import { describe, it, expect } from 'vitest';
import { calcPageWindow, applyPagination, clampPage } from '../src/features/pagination';

function makeRows(n: number): HTMLTableRowElement[] {
  return Array.from({ length: n }, () => document.createElement('tr'));
}

describe('calcPageWindow', () => {
  it('first page of 10 from 35', () => {
    const w = calcPageWindow(0, 10, 35);
    expect(w.start).toBe(0);
    expect(w.end).toBe(10);
    expect(w.totalPages).toBe(4);
  });

  it('last page is partial', () => {
    const w = calcPageWindow(3, 10, 35);
    expect(w.start).toBe(30);
    expect(w.end).toBe(35);
  });

  it('single page when rows <= pageLength', () => {
    const w = calcPageWindow(0, 25, 10);
    expect(w.totalPages).toBe(1);
    expect(w.start).toBe(0);
    expect(w.end).toBe(10);
  });

  it('clamps page to valid range', () => {
    const w = calcPageWindow(99, 10, 20);
    expect(w.start).toBe(10);
    expect(w.end).toBe(20);
  });

  it('handles zero rows', () => {
    const w = calcPageWindow(0, 10, 0);
    expect(w.totalPages).toBe(1);
    expect(w.start).toBe(0);
    expect(w.end).toBe(0);
  });
});

describe('applyPagination', () => {
  it('returns correct slice', () => {
    const rows = makeRows(30);
    const { visible, window: w } = applyPagination(rows, 1, 10);
    expect(visible).toHaveLength(10);
    expect(visible[0]).toBe(rows[10]);
    expect(w.totalPages).toBe(3);
  });

  it('last page may have fewer rows', () => {
    const rows = makeRows(25);
    const { visible } = applyPagination(rows, 2, 10);
    expect(visible).toHaveLength(5);
  });
});

describe('clampPage', () => {
  it('clamps to 0 when page is negative', () => {
    expect(clampPage(-1, 10, 30)).toBe(0);
  });

  it('clamps to last page when page exceeds total', () => {
    expect(clampPage(99, 10, 30)).toBe(2);
  });

  it('returns same page when within range', () => {
    expect(clampPage(1, 10, 30)).toBe(1);
  });
});
