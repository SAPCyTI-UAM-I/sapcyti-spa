/**
 * Best-effort access to a boolean flag in `localStorage`.
 * Reads/writes are guarded so the app keeps working in restricted browser
 * contexts (private mode, disabled storage) without throwing.
 */
export function readStoredBoolean(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function writeStoredBoolean(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Persistence is optional; ignore storage failures.
  }
}
