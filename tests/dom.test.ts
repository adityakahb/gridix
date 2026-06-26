import { describe, it, expect, vi } from 'vitest';
import { el, dispatch, debounce, escapeHtml, escapeRegex } from '../src/utils/dom';

describe('el', () => {
  it('creates an element with the specified tag', () => {
    expect(el('div').tagName).toBe('DIV');
    expect(el('span').tagName).toBe('SPAN');
  });

  it('sets all provided attributes', () => {
    const btn = el('button', { type: 'button', 'aria-label': 'Close' });
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.getAttribute('aria-label')).toBe('Close');
  });

  it('sets text content when the text argument is provided', () => {
    expect(el('span', {}, 'Hello').textContent).toBe('Hello');
  });

  it('leaves textContent empty when text is not provided', () => {
    expect(el('div').textContent).toBe('');
  });
});

describe('dispatch', () => {
  it('fires a CustomEvent with the given name', () => {
    const div = document.createElement('div');
    let fired = false;
    div.addEventListener('test:fire', () => {
      fired = true;
    });
    dispatch(div, 'test:fire');
    expect(fired).toBe(true);
  });

  it('attaches the detail object to the event', () => {
    const div = document.createElement('div');
    let captured: unknown;
    div.addEventListener('test:detail', e => {
      captured = (e as CustomEvent).detail;
    });
    dispatch(div, 'test:detail', { value: 42 });
    expect(captured).toEqual({ value: 42 });
  });

  it('bubbles up the DOM', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.appendChild(child);
    let bubbled = false;
    parent.addEventListener('test:bubble', () => {
      bubbled = true;
    });
    dispatch(child, 'test:bubble');
    expect(bubbled).toBe(true);
  });
});

describe('debounce', () => {
  it('delays execution until the wait period has elapsed', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('arg1');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('arg1');
    vi.useRealTimers();
  });

  it('resets the timer on each call, executing only once for rapid calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('first');
    vi.advanceTimersByTime(100);
    debounced('second');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('second');
    vi.useRealTimers();
  });

  it('fires again after a second quiescent period', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    vi.advanceTimersByTime(100);
    debounced('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('escapeHtml', () => {
  it('escapes &', () => expect(escapeHtml('a & b')).toBe('a &amp; b'));
  it('escapes <', () => expect(escapeHtml('<div>')).toBe('&lt;div&gt;'));
  it('escapes >', () => expect(escapeHtml('x > y')).toBe('x &gt; y'));
  it('escapes double quotes', () => expect(escapeHtml('"hi"')).toBe('&quot;hi&quot;'));
  it('leaves safe text unchanged', () => expect(escapeHtml('hello world')).toBe('hello world'));
  it('handles multiple special chars in one string', () => {
    expect(escapeHtml('<a href="x">link & text</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;link &amp; text&lt;/a&gt;',
    );
  });
});

describe('escapeRegex', () => {
  it('escapes dots and asterisks', () => {
    expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
  });
  it('escapes parentheses and square brackets', () => {
    expect(escapeRegex('(x)[y]')).toBe('\\(x\\)\\[y\\]');
  });
  it('escapes pipe, caret, and dollar', () => {
    expect(escapeRegex('a|b^c$d')).toBe('a\\|b\\^c\\$d');
  });
  it('escapes backslash', () => {
    expect(escapeRegex('a\\b')).toBe('a\\\\b');
  });
  it('leaves plain alphanumeric strings unchanged', () => {
    expect(escapeRegex('hello123')).toBe('hello123');
  });
});
