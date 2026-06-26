/**
 * Creates an HTML element with optional attributes and text content.
 *
 * @param tag - Tag name (key of `HTMLElementTagNameMap`).
 * @param attrs - Attribute name/value pairs to set on the element.
 * @param text - Optional `textContent` to set.
 * @returns The newly created element, typed to the specific tag.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, v);
  }
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Adds an event listener and returns a teardown function that removes it.
 *
 * @param target - The element (or `document`) to attach the listener to.
 * @param event - Event name from `HTMLElementEventMap`.
 * @param handler - Callback invoked on each event.
 * @param options - Optional `AddEventListenerOptions` (e.g. `{ passive: true }`).
 * @returns A zero-argument function that removes the listener when called.
 */
export function on<K extends keyof HTMLElementEventMap>(
  target: HTMLElement | Document,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void {
  target.addEventListener(event as string, handler as EventListener, options);
  return () => target.removeEventListener(event as string, handler as EventListener, options);
}

/**
 * Dispatches a bubbling `CustomEvent` with an optional `detail` payload.
 *
 * @param target - Element from which the event bubbles.
 * @param name - Event name (e.g. `"gridix:sort"`).
 * @param detail - Arbitrary payload available as `event.detail`.
 */
export function dispatch(target: HTMLElement, name: string, detail?: unknown): void {
  target.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

/**
 * Returns a debounced version of `fn` that delays execution until `ms`
 * milliseconds have elapsed since the last call.
 *
 * Rapid successive calls reset the timer; the wrapped function fires only once
 * after the caller goes quiet.
 *
 * @param fn - The function to debounce.
 * @param ms - Quiescent period in milliseconds.
 * @returns A debounced function with the same signature as `fn`.
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/**
 * Escapes the four HTML-sensitive characters (`&`, `<`, `>`, `"`) so that a
 * raw string can be safely inserted into HTML markup.
 *
 * @param str - The raw string to escape.
 * @returns The HTML-encoded string.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escapes all RegExp special characters in `str` so the result can be used
 * safely inside `new RegExp(...)` without unintended pattern behaviour.
 *
 * @param str - The literal string to escape.
 * @returns A string with all regex metacharacters backslash-escaped.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
