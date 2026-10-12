import type { BatchManifest, DocumentType, UploadDescriptor } from '../../../models';

/** Selección local lista para el POST HU-65; misma forma que el control de carga. */
export type SaveDocumentSelection =
  | { readonly documentType: DocumentType; readonly kind: 'PDF'; readonly file: File }
  | { readonly documentType: DocumentType; readonly kind: 'URL'; readonly url: string };

/** Nombre exacto de la parte binaria: file_<DOCUMENT_TYPE>. */
export function filePartName(documentType: DocumentType): string {
  return `file_${documentType}`;
}

/**
 * Arma el multipart de guardado: manifest JSON + files PDF.
 * No fija Content-Type; el navegador pone el boundary.
 */
export function buildSaveDocumentsFormData(
  version: number,
  selections: readonly SaveDocumentSelection[],
): FormData {
  const documents: UploadDescriptor[] = selections.map((selection) =>
    selection.kind === 'PDF'
      ? {
          documentType: selection.documentType,
          kind: 'PDF',
          filePart: filePartName(selection.documentType),
        }
      : {
          documentType: selection.documentType,
          kind: 'URL',
          externalUrl: selection.url,
        },
  );

  const manifest: BatchManifest = { version, documents };
  const formData = new FormData();
  formData.append('manifest', new Blob([JSON.stringify(manifest)], { type: 'application/json' }));

  // Solo PDF viaja como parte binaria; la URL queda en el manifest.
  for (const selection of selections) {
    if (selection.kind === 'PDF') {
      formData.append(filePartName(selection.documentType), selection.file, selection.file.name);
    }
  }

  return formData;
}

/**
 * Multipart de reemplazo PDF: version en texto plano y file con el nombre original.
 * Tampoco se escribe Content-Type a mano.
 */
export function buildReplacePdfFormData(version: number, file: File): FormData {
  const formData = new FormData();
  formData.append('version', String(version));
  formData.append('file', file, file.name);
  return formData;
}
