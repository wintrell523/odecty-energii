const MIN_YEAR = 1900;
const MAX_YEAR = 9999;

/** Returns a supported four-digit calendar year, or null for invalid input. */
export function parseYear(value: string | undefined | null): number | null {
  if (!value || !/^\d{4}$/.test(value)) return null;

  const year = Number(value);
  return year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
}
