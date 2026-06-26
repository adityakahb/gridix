/**
 * Singleton `aria-live="polite"` region used for screen-reader announcements.
 *
 * The region is created the first time `announce()` is called and then reused.
 * If the element is removed from the DOM (e.g. via `document.body.innerHTML = ''`
 * in tests) it is recreated transparently on the next call.
 */
let region: HTMLElement | null = null;

/**
 * Returns the singleton live region, creating and appending it to `<body>` if
 * it does not yet exist or has been removed from the DOM.
 */
function getRegion(): HTMLElement {
  if (!region || !document.body.contains(region)) {
    region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'gridix-sr-only';
    document.body.appendChild(region);
  }
  return region;
}

/**
 * Announces a message to assistive technologies via the `aria-live="polite"`
 * singleton region.
 *
 * The region is cleared first so that repeating identical messages are always
 * re-announced. The actual text is set inside `requestAnimationFrame` to give
 * the browser time to register the DOM mutation before applying the new value.
 *
 * @param message - The plain-text string to announce.
 */
export function announce(message: string): void {
  const el = getRegion();
  // Clear then set to ensure re-announcement of identical messages
  el.textContent = '';
  // Small delay lets the DOM mutation register before the new text is set
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}
