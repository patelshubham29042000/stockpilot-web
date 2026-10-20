/** The server stores UTC but sends dates without a "Z". Add it so the browser shows local time. */
export const asUtc = (value: string): string => (/(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value + 'Z');
