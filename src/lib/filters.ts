/** The readings list URL that keeps a valid ?meter= filter. */
export function readingsListUrl(meter: string | undefined): string {
  return meter && /^\d+$/.test(meter) ? `/readings?meter=${meter}` : "/readings";
}
