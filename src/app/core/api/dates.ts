/** The server stores UTC but sends dates without a "Z". Add it so the browser shows local time. */
export const asUtc = (value: string): string => (/(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value + 'Z');

/** A date as yyyy-MM-dd in the user's own time zone (what a date input expects). */
export const localDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayLocal = (): string => localDateString(new Date());
export const daysAgoLocal = (days: number): string => { const d = new Date(); d.setDate(d.getDate() - days); return localDateString(d); };
/** The first and last moment of a local day, as exact ISO times for the server. */
export const dayStartIso = (date: string): string => new Date(`${date}T00:00:00`).toISOString();
export const dayEndIso = (date: string): string => new Date(`${date}T23:59:59.999`).toISOString();
