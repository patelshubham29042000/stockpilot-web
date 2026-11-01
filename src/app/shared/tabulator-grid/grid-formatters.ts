/** Small helpers for building Tabulator cells. Cells are HTML strings, so every value goes through esc(). */

export type BadgeKind = 'ok' | 'warn' | 'low' | '';
export interface GridButton {
  action: string;
  label: string;
  kind?: 'alt' | 'ok' | 'bad' | 'pri';
  disabled?: boolean;
  title?: string;     // tooltip, for example why a button is disabled
}

/** Makes a value safe to place inside HTML. */
export const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** The coloured status pill (ok = green, warn = amber, low = red). */
export const badge = (text: unknown, kind: BadgeKind = ''): string => `<span class="badge ${kind}">${esc(text)}</span>`;

/** Buttons at the end of a row. A click reaches the page through (rowAction) with the button's `action` name. */
export const actionButtons = (buttons: GridButton[]): string => {
  const html = buttons.map(b =>
    `<button type="button" class="btn ${b.kind ?? 'alt'} sm" data-action="${b.action}"` +
    `${b.disabled ? ' disabled' : ''}${b.title ? ` title="${esc(b.title)}"` : ''}>${esc(b.label)}</button>`).join('');
  return `<div class="act">${html}</div>`;
};

/** Rupee format for Tabulator's built-in money formatter. */
export const money = { symbol: '₹', precision: 2, thousand: ',', decimal: '.' };

/** A date and time in the user's own time zone. */
export const dateTime = (value: unknown): string => {
  const d = new Date(value as string);
  return isNaN(+d) ? '' : esc(new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(d));
};

/** An amount as rupees, for calculated cells. */
export const rupees = (n: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);

/** A date without the time, in the user's own time zone. */
export const dateOnly = (value: unknown): string => {
  const d = new Date(value as string);
  return isNaN(+d) ? '' : esc(new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(d));
};
