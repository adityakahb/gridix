import { vi } from 'vitest';

// ResizeObserver is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// scrollWidth is always 0 in jsdom — widthDetector tests override per-case
