/** Error ya normalizado para la UI. `details` solo se copia si el cuerpo lo trae. */
export interface ParsedApiError {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
}
