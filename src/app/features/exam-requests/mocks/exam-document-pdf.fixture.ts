/**
 * PDF mínimo compartido por el mock y las pruebas de igualdad byte a byte.
 * Empieza con %PDF; no se recomprime al servir el contenido.
 */
export const EXAM_DOCUMENT_PDF_FIXTURE = Uint8Array.from([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a,
]);
