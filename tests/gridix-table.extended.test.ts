import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GridixTable as Gridix } from '../src/core/gridix-table';

function makeTable(attrs = '', bodyRows = 5): HTMLTableElement {
  const rows = Array.from(
    { length: bodyRows },
    (_, i) => `<tr><td>${i + 1}</td><td>Name${i + 1}</td><td>Role${i + 1}</td></tr>`,
  ).join('');
  const div = document.createElement('div');
  div.innerHTML = `
    <table data-gridix ${attrs}>
      <thead><tr>
        <th data-gridix-col-type="number">ID</th>
        <th>Name</th>
        <th>Role</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  document.body.appendChild(div);
  return div.querySelector('table') as HTMLTableElement;
}

describe('GridixTable — sort interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('clicking a sortable header cycles to ascending', () => {
    const t = makeTable('data-gridix-sort="true"');
    new Gridix(t);
    const th = t.querySelector('.gridix-th--sortable') as HTMLElement;
    th.click();
    expect(th.getAttribute('aria-sort')).toBe('ascending');
  });

  it('clicking a sortable header twice cycles to descending', () => {
    const t = makeTable('data-gridix-sort="true"');
    new Gridix(t);
    const th = t.querySelector('.gridix-th--sortable') as HTMLElement;
    th.click();
    th.click();
    expect(th.getAttribute('aria-sort')).toBe('descending');
  });

  it('clicking a sortable header three times cycles back to none', () => {
    const t = makeTable('data-gridix-sort="true"');
    new Gridix(t);
    const th = t.querySelector('.gridix-th--sortable') as HTMLElement;
    th.click(); // asc
    th.click(); // desc
    th.click(); // none
    expect(th.getAttribute('aria-sort')).toBe('none');
  });

  it('pressing Enter on a sortable header triggers sort', () => {
    const t = makeTable('data-gridix-sort="true"');
    new Gridix(t);
    const th = t.querySelector('.gridix-th--sortable') as HTMLElement;
    th.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(th.getAttribute('aria-sort')).toBe('ascending');
  });

  it('pressing Space on a sortable header triggers sort', () => {
    const t = makeTable('data-gridix-sort="true"');
    new Gridix(t);
    const th = t.querySelector('.gridix-th--sortable') as HTMLElement;
    th.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(th.getAttribute('aria-sort')).toBe('ascending');
  });
});

describe('GridixTable — col-vis dropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('clicking the Columns button opens the dropdown', () => {
    const t = makeTable('data-gridix-col-visibility="true"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLButtonElement;
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.gridix-col-vis-dropdown')?.hasAttribute('hidden')).toBe(false);
  });

  it('clicking the Columns button again closes the dropdown', () => {
    const t = makeTable('data-gridix-col-visibility="true"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLButtonElement;
    btn.click();
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape inside the dropdown closes it and refocuses the button', () => {
    const t = makeTable('data-gridix-col-visibility="true"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLButtonElement;
    btn.click();
    const dropdown = document.querySelector('.gridix-col-vis-dropdown') as HTMLElement;
    dropdown.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(dropdown.hasAttribute('hidden')).toBe(true);
  });

  it('unchecking a col-vis checkbox hides that column', () => {
    const t = makeTable('data-gridix-col-visibility="true"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLButtonElement;
    btn.click();
    const cb = document.querySelector('.gridix-col-vis-dropdown input') as HTMLInputElement;
    cb.checked = false;
    cb.dispatchEvent(new Event('change'));
    const th = t.querySelectorAll('thead tr:first-child th')[0];
    expect(th.classList.contains('gridix-col--hidden')).toBe(true);
  });

  it('rechecking a col-vis checkbox shows the column again', () => {
    const t = makeTable('data-gridix-col-visibility="true"');
    const g = new Gridix(t);
    g.hideCol(0);
    const btn = document.querySelector('.gridix-col-vis-btn') as HTMLButtonElement;
    btn.click();
    const cb = document.querySelector('.gridix-col-vis-dropdown input') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    const th = t.querySelectorAll('thead tr:first-child th')[0];
    expect(th.classList.contains('gridix-col--hidden')).toBe(false);
  });
});

describe('GridixTable — export dropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('clicking the Export button opens the export menu', () => {
    const t = makeTable('data-gridix-export="csv,json"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-export-btn') as HTMLButtonElement;
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.gridix-export-menu')?.hasAttribute('hidden')).toBe(false);
  });

  it('clicking the Export button again closes the menu', () => {
    const t = makeTable('data-gridix-export="csv"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-export-btn') as HTMLButtonElement;
    btn.click();
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape inside the export menu closes it', () => {
    const t = makeTable('data-gridix-export="csv"');
    new Gridix(t);
    const btn = document.querySelector('.gridix-export-btn') as HTMLButtonElement;
    btn.click();
    const menu = document.querySelector('.gridix-export-menu') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('clicking an export menu item triggers the export and closes the menu', () => {
    vi.stubGlobal(
      'Blob',
      vi.fn(() => ({ size: 0, type: '' }) as Blob),
    );
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      writable: true,
      configurable: true,
    });

    const t = makeTable('data-gridix-export="csv"');
    new Gridix(t);
    (document.querySelector('.gridix-export-btn') as HTMLButtonElement).click();
    (document.querySelector('.gridix-export-item') as HTMLButtonElement).click();

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(document.querySelector('.gridix-export-menu')?.hasAttribute('hidden')).toBe(true);

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});

describe('GridixTable — row selection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('getSelectedRows() returns an empty array initially', () => {
    const t = makeTable('data-gridix-row-select="multi"');
    const g = new Gridix(t);
    expect(g.getSelectedRows()).toEqual([]);
  });

  it('clicking a row checkbox selects it', () => {
    const t = makeTable('data-gridix-row-select="multi"');
    const g = new Gridix(t);
    const rowCbs = t.querySelectorAll<HTMLInputElement>('tbody .gridix-checkbox-col input');
    rowCbs[0].checked = true;
    rowCbs[0].dispatchEvent(new Event('change'));
    expect(g.getSelectedRows()).toContain(0);
  });

  it('unchecking a row checkbox deselects it', () => {
    const t = makeTable('data-gridix-row-select="multi"');
    const g = new Gridix(t);
    const rowCbs = t.querySelectorAll<HTMLInputElement>('tbody .gridix-checkbox-col input');
    rowCbs[0].checked = true;
    rowCbs[0].dispatchEvent(new Event('change'));
    rowCbs[0].checked = false;
    rowCbs[0].dispatchEvent(new Event('change'));
    expect(g.getSelectedRows()).not.toContain(0);
  });

  it('select-all checkbox selects every row', () => {
    const t = makeTable('data-gridix-row-select="multi"', 3);
    const g = new Gridix(t);
    const allCb = t.querySelector<HTMLInputElement>('thead .gridix-checkbox-col input')!;
    allCb.checked = true;
    allCb.dispatchEvent(new Event('change'));
    expect(g.getSelectedRows().length).toBe(3);
  });

  it('unchecking select-all deselects every row', () => {
    const t = makeTable('data-gridix-row-select="multi"', 3);
    const g = new Gridix(t);
    const allCb = t.querySelector<HTMLInputElement>('thead .gridix-checkbox-col input')!;
    allCb.checked = true;
    allCb.dispatchEvent(new Event('change'));
    allCb.checked = false;
    allCb.dispatchEvent(new Event('change'));
    expect(g.getSelectedRows().length).toBe(0);
  });
});

describe('GridixTable — pagination interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('goToPage() navigates to the specified 0-based page', () => {
    const t = makeTable('data-gridix-pagination="true" data-gridix-page-length="2"', 6);
    const g = new Gridix(t);
    g.goToPage(1);
    expect(document.querySelector('.gridix-page-btn--active')?.getAttribute('aria-label')).toBe(
      'Page 2',
    );
  });

  it('Next page button advances one page', () => {
    const t = makeTable('data-gridix-pagination="true" data-gridix-page-length="2"', 6);
    new Gridix(t);
    (document.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click();
    expect(document.querySelector('.gridix-page-btn--active')?.getAttribute('aria-label')).toBe(
      'Page 2',
    );
  });

  it('Last page button jumps to the final page', () => {
    const t = makeTable('data-gridix-pagination="true" data-gridix-page-length="2"', 6);
    new Gridix(t);
    (document.querySelector('[aria-label="Last page"]') as HTMLButtonElement).click();
    expect(document.querySelector('.gridix-page-btn--active')?.getAttribute('aria-label')).toBe(
      'Page 3',
    );
  });

  it('First page button is disabled on page 1', () => {
    const t = makeTable('data-gridix-pagination="true" data-gridix-page-length="2"', 6);
    new Gridix(t);
    const firstBtn = document.querySelector('[aria-label="First page"]') as HTMLButtonElement;
    expect(firstBtn.disabled).toBe(true);
  });

  it('page-length select change updates the page size', () => {
    const t = makeTable(
      'data-gridix-pagination="true" data-gridix-page-length="5" data-gridix-page-length-menu="2,5,10"',
      10,
    );
    new Gridix(t);
    const sel = document.querySelector<HTMLSelectElement>('.gridix-page-length-select')!;
    sel.value = '2';
    sel.dispatchEvent(new Event('change'));
    expect(document.querySelector('.gridix-page-info')?.textContent).toContain('1–2');
  });
});

describe('GridixTable — fixed header', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('applies sticky positioning to thead when data-gridix-fixed-header is set', () => {
    const t = makeTable('data-gridix-fixed-header="true"');
    new Gridix(t);
    const thead = t.querySelector<HTMLElement>('thead')!;
    expect(thead.style.position).toBe('sticky');
    expect(thead.style.top).toBe('0px');
  });

  it('respects data-gridix-fixed-header-offset', () => {
    const t = makeTable('data-gridix-fixed-header="true" data-gridix-fixed-header-offset="60"');
    new Gridix(t);
    const thead = t.querySelector<HTMLElement>('thead')!;
    expect(thead.style.top).toBe('60px');
  });
});

describe('GridixTable — col search', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters rows based on per-column search input after debounce', () => {
    vi.useFakeTimers();
    const t = makeTable('data-gridix-col-search="true"', 3);
    new Gridix(t);
    // Second input targets the Name column (values: Name1, Name2, Name3)
    const inputs = t.querySelectorAll<HTMLInputElement>('.gridix-col-search-input');
    const nameInput = inputs[1];
    nameInput.value = 'Name1';
    nameInput.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(250);
    const visible = Array.from(t.querySelectorAll('tbody tr:not(.gridix-empty-row)')).filter(
      r => (r as HTMLElement).style.display !== 'none',
    );
    expect(visible.length).toBe(1);
  });
});

describe('GridixTable — search debounce', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('search input updates rows after debounce fires', () => {
    vi.useFakeTimers();
    const t = makeTable('data-gridix-search="true"', 3);
    new Gridix(t);
    const input = document.querySelector<HTMLInputElement>('.gridix-search-input')!;
    input.value = 'Name1';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(250);
    const visible = Array.from(t.querySelectorAll('tbody tr:not(.gridix-empty-row)')).filter(
      r => (r as HTMLElement).style.display !== 'none',
    );
    expect(visible.length).toBe(1);
  });
});
