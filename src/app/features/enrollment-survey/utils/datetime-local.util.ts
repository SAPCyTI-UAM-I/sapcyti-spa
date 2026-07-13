/**
 * Conversions between an `<input type="datetime-local">` value ("YYYY-MM-DDTHH:mm",
 * interpreted in the browser's local zone) and an ISO instant sent to / received from the API.
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/** Local datetime-local string → ISO instant (UTC). Empty input → ''. */
export function localToIso(value: string): string {
  if (!value) return '';
  const date = new Date(value); // parsed as local time
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** ISO instant → local datetime-local string ("YYYY-MM-DDTHH:mm"). Empty/invalid → ''. */
export function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
