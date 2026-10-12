import type { BatchManifest } from '../../../models';
import {
  buildReplacePdfFormData,
  buildSaveDocumentsFormData,
  filePartName,
} from './exam-document-form-data.util';

const THESIS_NAME = 'Tesis_Mtria_Lopez_Alba_Emanuel.pdf';
const HISTORY_NAME = 'Hist_Acad_Lopez_Alba_Emanuel.pdf';
const ARTICLE_URL = 'https://revista.ejemplo.org/articulo/123';

function pdfFile(name: string): File {
  return new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], name, {
    type: 'application/pdf',
  });
}

async function readManifest(formData: FormData): Promise<BatchManifest> {
  const part = formData.get('manifest');
  expect(part).toBeInstanceOf(Blob);
  const blob = part as Blob;
  expect(blob.type).toBe('application/json');
  return JSON.parse(await blob.text()) as BatchManifest;
}

describe('exam-document-form-data.util', () => {
  describe('filePartName', () => {
    it('uses the exact file_<DOCUMENT_TYPE> part name', () => {
      expect(filePartName('TESIS')).toBe('file_TESIS');
      expect(filePartName('HIST_ACAD')).toBe('file_HIST_ACAD');
      expect(filePartName('ARTICULO')).toBe('file_ARTICULO');
    });
  });

  describe('buildSaveDocumentsFormData', () => {
    it('serializes the manifest as an application/json Blob and PDF parts with original names', async () => {
      const thesis = pdfFile(THESIS_NAME);
      const history = pdfFile(HISTORY_NAME);
      const formData = buildSaveDocumentsFormData(0, [
        { documentType: 'TESIS', kind: 'PDF', file: thesis },
        { documentType: 'HIST_ACAD', kind: 'PDF', file: history },
      ]);

      await expect(readManifest(formData)).resolves.toEqual({
        version: 0,
        documents: [
          { documentType: 'TESIS', kind: 'PDF', filePart: 'file_TESIS' },
          { documentType: 'HIST_ACAD', kind: 'PDF', filePart: 'file_HIST_ACAD' },
        ],
      });

      const thesisPart = formData.get('file_TESIS');
      expect(thesisPart).toBeInstanceOf(File);
      expect((thesisPart as File).name).toBe(THESIS_NAME);

      const historyPart = formData.get('file_HIST_ACAD');
      expect(historyPart).toBeInstanceOf(File);
      expect((historyPart as File).name).toBe(HISTORY_NAME);
    });

    it('keeps article URLs only in the manifest and omits a binary part', async () => {
      const thesis = pdfFile(THESIS_NAME);
      const formData = buildSaveDocumentsFormData(1, [
        { documentType: 'TESIS', kind: 'PDF', file: thesis },
        { documentType: 'ARTICULO', kind: 'URL', url: ARTICLE_URL },
      ]);

      await expect(readManifest(formData)).resolves.toEqual({
        version: 1,
        documents: [
          { documentType: 'TESIS', kind: 'PDF', filePart: 'file_TESIS' },
          { documentType: 'ARTICULO', kind: 'URL', externalUrl: ARTICLE_URL },
        ],
      });

      expect(formData.get('file_TESIS')).toBeInstanceOf(File);
      expect(formData.get('file_ARTICULO')).toBeNull();
      expect(formData.has('ARTICULO')).toBe(false);
    });

    it('does not attach a loose version part on the save envelope', () => {
      const formData = buildSaveDocumentsFormData(2, [
        { documentType: 'TESIS', kind: 'PDF', file: pdfFile(THESIS_NAME) },
      ]);

      expect(formData.has('version')).toBe(false);
    });
  });

  describe('buildReplacePdfFormData', () => {
    it('sends version as plain text and file with the original filename', () => {
      const file = pdfFile(THESIS_NAME);
      const formData = buildReplacePdfFormData(4, file);

      expect(formData.get('version')).toBe('4');
      const part = formData.get('file');
      expect(part).toBeInstanceOf(File);
      expect((part as File).name).toBe(THESIS_NAME);
      expect(formData.has('manifest')).toBe(false);
    });
  });
});
