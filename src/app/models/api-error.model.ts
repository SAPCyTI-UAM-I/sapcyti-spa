/** Cuerpo de error del API. `details` es opcional y retrocompatible (HU-62). */
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
