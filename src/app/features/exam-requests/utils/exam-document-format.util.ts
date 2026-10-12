/** Formatea sizeBytes para el panel; null no inventa un tamaño. */
export function formatDocumentFileSize(sizeBytes: number | null): string | null {
  if (sizeBytes === null || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return null;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const kibibytes = sizeBytes / 1024;
  if (kibibytes < 1024) {
    return `${formatMagnitude(kibibytes)} KB`;
  }

  return `${formatMagnitude(kibibytes / 1024)} MB`;
}

/**
 * Convierte uploadedAt UTC (Z) a fecha-hora local.
 * No muestra la zona; el instante sí se interpreta en el huso del navegador.
 */
export function formatUploadedAt(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return '';
  }

  const pad = (part: number): string => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatMagnitude(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
