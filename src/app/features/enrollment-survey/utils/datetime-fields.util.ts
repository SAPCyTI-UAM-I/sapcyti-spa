/**
 * Combines / splits the native `<input type="date">` ("YYYY-MM-DD") and
 * `<input type="time">` ("HH:MM") fields against an ISO instant (local zone).
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/** date + time fields → local Date, or null when either is empty/invalid. */
export function combineToDate(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}`); // parsed as local time
  return Number.isNaN(value.getTime()) ? null : value;
}

/** date + time fields → ISO instant, or '' when incomplete. */
export function combineToIso(date: string, time: string): string {
  const value = combineToDate(date, time);
  return value ? value.toISOString() : '';
}

/** ISO instant → "YYYY-MM-DD" (local). */
export function isoToDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '';
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/** ISO instant → "HH:MM" (local). */
export function isoToTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '';
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
