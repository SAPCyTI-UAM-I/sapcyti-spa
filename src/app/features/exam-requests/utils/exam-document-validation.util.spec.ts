import type { DocumentKind, DocumentType } from '../../../models';
import {
  hasPdfMagicBytes,
  isHttpsArticleUrl,
  matchesExpectedDocumentName,
  readPdfSample,
  validatePendingDocument,
} from './exam-document-validation.util';

const EMANUEL_THESIS = 'Tesis_Mtria_Lopez_Alba_Emanuel.pdf';
const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

function pdfFile(name: string, extraBytes = 0): File {
  const padding = extraBytes > 0 ? new Uint8Array(extraBytes) : new Uint8Array(0);
  const body = extraBytes > 0 ? new Uint8Array(PDF_HEADER.length + extraBytes) : PDF_HEADER;
  if (extraBytes > 0) {
    body.set(PDF_HEADER);
    body.set(padding, PDF_HEADER.length);
  }
  return new File([body], name, { type: 'application/octet-stream' });
}

function notPdfFile(name: string): File {
  return new File([new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04])], name, {
    type: 'application/pdf',
  });
}

function pdfInput(
  extras: Partial<{
    files: File[];
    documentType: DocumentType;
    expectedName: string | null;
    acceptedKinds: readonly DocumentKind[];
    kind: DocumentKind;
    url: string | null;
  }> = {},
) {
  return {
    files: extras.files ?? [pdfFile(EMANUEL_THESIS)],
    documentType: extras.documentType ?? 'TESIS',
    expectedName: extras.expectedName !== undefined ? extras.expectedName : EMANUEL_THESIS,
    acceptedKinds: extras.acceptedKinds ?? (['PDF'] as const),
    kind: extras.kind ?? 'PDF',
    url: extras.url ?? null,
  };
}

describe('exam-document-validation.util', () => {
  describe('matchesExpectedDocumentName', () => {
    it('accepts the Emanuel thesis name ignoring only case and .PDF', () => {
      expect(matchesExpectedDocumentName(EMANUEL_THESIS, EMANUEL_THESIS)).toBe(true);
      expect(matchesExpectedDocumentName('TESIS_MTRIA_LOPEZ_ALBA_EMANUEL.PDF', EMANUEL_THESIS)).toBe(
        true,
      );
    });

    it('rejects accents, another type, and a wrong degree prefix', () => {
      expect(
        matchesExpectedDocumentName('Tesis_Mtria_López_Alba_Emanuel.pdf', EMANUEL_THESIS),
      ).toBe(false);
      expect(matchesExpectedDocumentName('historia.pdf', 'Hist_Acad_Lopez_Alba_Emanuel.pdf')).toBe(
        false,
      );
      expect(
        matchesExpectedDocumentName('Tesis_Docto_Lopez_Alba_Emanuel.pdf', EMANUEL_THESIS),
      ).toBe(false);
      expect(
        matchesExpectedDocumentName(
          'Hist_Acad_Lopez_Alba_Emanuel.pdf',
          'Comp_Idioma_Lopez_Alba_Emanuel.pdf',
        ),
      ).toBe(false);
    });

    it('accepts names without maternal surname and composed names from the API', () => {
      expect(
        matchesExpectedDocumentName('Hist_Acad_Lopez_Emanuel.pdf', 'Hist_Acad_Lopez_Emanuel.pdf'),
      ).toBe(true);
      expect(
        matchesExpectedDocumentName(
          'Hist_Acad_Pena_Nunez_Maria_Jose.pdf',
          'Hist_Acad_Pena_Nunez_Maria_Jose.pdf',
        ),
      ).toBe(true);
    });
  });

  describe('hasPdfMagicBytes and readPdfSample', () => {
    it('detects %PDF and ignores File.type', async () => {
      expect(hasPdfMagicBytes(PDF_HEADER)).toBe(true);
      expect(hasPdfMagicBytes(new Uint8Array([0x25, 0x50]))).toBe(false);
      expect(hasPdfMagicBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toBe(false);

      const sample = await readPdfSample(notPdfFile('Tesis_Mtria_Lopez_Alba_Emanuel.pdf'));
      expect(sample.length).toBeLessThanOrEqual(8);
      expect(hasPdfMagicBytes(sample)).toBe(false);
    });
  });

  describe('isHttpsArticleUrl', () => {
    it('accepts an absolute https URL and rejects anything else', () => {
      expect(isHttpsArticleUrl('https://revista.ejemplo.org/articulo/123')).toBe(true);
      expect(isHttpsArticleUrl('  https://revista.ejemplo.org/articulo/123  ')).toBe(true);
      expect(isHttpsArticleUrl('http://revista.ejemplo.org/articulo/123')).toBe(false);
      expect(isHttpsArticleUrl('HTTPS://revista.ejemplo.org/articulo/123')).toBe(false);
      expect(isHttpsArticleUrl('revista ejemplo')).toBe(false);
      expect(isHttpsArticleUrl('https://')).toBe(false);
    });
  });

  describe('validatePendingDocument', () => {
    it('accepts a valid regulated PDF including a large file', async () => {
      const large = pdfFile(EMANUEL_THESIS);
      Object.defineProperty(large, 'size', { value: 25 * 1024 * 1024 });

      await expect(validatePendingDocument(pdfInput())).resolves.toEqual({ ok: true });
      await expect(validatePendingDocument(pdfInput({ files: [large] }))).resolves.toEqual({
        ok: true,
      });
    });

    it('rejects a wrong name and keeps the API expectedName', async () => {
      await expect(
        validatePendingDocument(
          pdfInput({
            files: [pdfFile('historia.pdf')],
            expectedName: 'Hist_Acad_Lopez_Alba_Emanuel.pdf',
          }),
        ),
      ).resolves.toEqual({
        ok: false,
        code: 'INVALID_DOCUMENT_NAME',
        expectedName: 'Hist_Acad_Lopez_Alba_Emanuel.pdf',
      });
    });

    it('rejects a fake PDF even when File.type claims application/pdf', async () => {
      await expect(
        validatePendingDocument(pdfInput({ files: [notPdfFile(EMANUEL_THESIS)] })),
      ).resolves.toEqual({ ok: false, code: 'INVALID_PDF_CONTENT' });
    });

    it('rejects multiple files at once', async () => {
      await expect(
        validatePendingDocument(
          pdfInput({ files: [pdfFile(EMANUEL_THESIS), pdfFile('otra.pdf')] }),
        ),
      ).resolves.toEqual({ ok: false, code: 'SINGLE_FILE_ONLY' });
    });

    it('accepts a free-named article PDF and a valid https URL', async () => {
      await expect(
        validatePendingDocument(
          pdfInput({
            files: [pdfFile('paper-final.pdf')],
            documentType: 'ARTICULO',
            expectedName: null,
            acceptedKinds: ['PDF', 'URL'],
          }),
        ),
      ).resolves.toEqual({ ok: true });

      await expect(
        validatePendingDocument(
          pdfInput({
            files: [],
            documentType: 'ARTICULO',
            expectedName: null,
            acceptedKinds: ['PDF', 'URL'],
            kind: 'URL',
            url: 'https://revista.ejemplo.org/articulo/123',
          }),
        ),
      ).resolves.toEqual({ ok: true });
    });

    it('rejects an invalid article URL and URL kind on non-article types', async () => {
      await expect(
        validatePendingDocument(
          pdfInput({
            files: [],
            documentType: 'ARTICULO',
            expectedName: null,
            acceptedKinds: ['PDF', 'URL'],
            kind: 'URL',
            url: 'revista ejemplo',
          }),
        ),
      ).resolves.toEqual({ ok: false, code: 'INVALID_ARTICLE_URL' });

      await expect(
        validatePendingDocument(
          pdfInput({
            files: [],
            kind: 'URL',
            url: 'https://revista.ejemplo.org/articulo/123',
            acceptedKinds: ['PDF', 'URL'],
          }),
        ),
      ).resolves.toEqual({ ok: false, code: 'DOCUMENT_KIND_NOT_ALLOWED' });
    });

    it('does not invent a name when expectedName is missing on a regulated type', async () => {
      await expect(validatePendingDocument(pdfInput({ expectedName: null }))).resolves.toEqual({
        ok: false,
        code: 'EXPECTED_NAME_UNAVAILABLE',
      });
    });
  });
});
