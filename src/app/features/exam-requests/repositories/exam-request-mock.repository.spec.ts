import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { EXAM_DOCUMENT_PDF_FIXTURE } from '../mocks/exam-document-pdf.fixture';
import { ExamRequestMockStore } from '../mocks/exam-request-mock.store';
import { ExamRequestMockRepository } from './exam-request-mock.repository';

describe('ExamRequestMockRepository', () => {
  let repo: ExamRequestMockRepository;
  let store: ExamRequestMockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExamRequestMockRepository],
    });
    repo = TestBed.inject(ExamRequestMockRepository);
    store = TestBed.inject(ExamRequestMockStore);
  });

  it('returns five requirements in stable order for Emanuel Lopez Alba', async () => {
    store.setScenario('maestria-emanuel');

    const response = await firstValueFrom(repo.getRequirements('GRADO'));
    const types = response.requirements.map((item) => item.documentType);

    expect(response.degree).toBe('MAESTRIA');
    expect(response.programStatus).toBe('EGRESADO');
    expect(response.eligible).toBe(true);
    expect(types).toEqual(['TESIS', 'SOL_SINODALES', 'HIST_ACAD', 'COMP_IDIOMA', 'DATOS_ALUM']);
    expect(response.requirements).toHaveLength(5);
    expect(response.requirements[0]?.exampleName).toBe('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');
  });

  it('omits Articulo for especializacion and uses the Esp thesis prefix', async () => {
    store.setScenario('especializacion');

    const response = await firstValueFrom(repo.getRequirements('GRADO'));
    const types = response.requirements.map((item) => item.documentType);

    expect(response.requirements).toHaveLength(5);
    expect(types).not.toContain('ARTICULO');
    expect(response.requirements[0]?.exampleName).toBe('Tesis_Esp_Garcia_Ruiz_Maria.pdf');
  });

  it('inserts Articulo after thesis for doctorado', async () => {
    store.setScenario('doctorado');

    const response = await firstValueFrom(repo.getRequirements('GRADO'));
    const types = response.requirements.map((item) => item.documentType);
    const article = response.requirements.find((item) => item.documentType === 'ARTICULO');

    expect(response.requirements).toHaveLength(6);
    expect(types).toEqual([
      'TESIS',
      'ARTICULO',
      'SOL_SINODALES',
      'HIST_ACAD',
      'COMP_IDIOMA',
      'DATOS_ALUM',
    ]);
    expect(article?.expectedName).toBeNull();
    expect(article?.exampleName).toBeNull();
    expect(article?.required).toBe(true);
    expect(response.examType).toBe('GRADO');
  });

  it('marks Articulo as optional on doctoral PREDOCTORAL and keeps a distinct request', async () => {
    store.setScenario('doctorado');

    const predoctoral = await firstValueFrom(repo.getRequirements('PREDOCTORAL'));
    const grado = await firstValueFrom(repo.getRequirements('GRADO'));
    const article = predoctoral.requirements.find((item) => item.documentType === 'ARTICULO');

    expect(predoctoral.examType).toBe('PREDOCTORAL');
    expect(predoctoral.requirements).toHaveLength(6);
    expect(article?.required).toBe(false);
    expect(predoctoral.requirements[0]?.exampleName).toBe('Tesis_Docto_Perez_Soto_Luis.pdf');
    expect(predoctoral.request).toMatchObject({
      id: 6301,
      examType: 'PREDOCTORAL',
      status: 'ENVIADA',
      folio: 'SEG-184201-110001',
    });
    expect(grado.request).toMatchObject({
      id: 6302,
      examType: 'GRADO',
      status: 'BORRADOR',
      folio: null,
    });
    expect(predoctoral.request?.id).not.toBe(grado.request?.id);
    expect(predoctoral.request?.folio).not.toBe(grado.request?.folio);
  });

  it('rejects PREDOCTORAL with EXAM_TYPE_NOT_ALLOWED for maestria and especializacion', async () => {
    store.setScenario('maestria-emanuel');
    await expect(firstValueFrom(repo.getRequirements('PREDOCTORAL'))).rejects.toMatchObject({
      status: 403,
      error: { error: 'EXAM_TYPE_NOT_ALLOWED' },
    });

    store.setScenario('especializacion');
    await expect(firstValueFrom(repo.getRequirements('PREDOCTORAL'))).rejects.toMatchObject({
      status: 403,
      error: { error: 'EXAM_TYPE_NOT_ALLOWED' },
    });
  });

  it('marks baja and suspension as ineligible and can return an empty list', async () => {
    store.setScenario('baja');
    await expect(firstValueFrom(repo.getOptions())).resolves.toMatchObject({
      eligible: false,
      eligibilityReason: 'PROGRAM_BAJA',
    });

    store.setScenario('suspension');
    await expect(firstValueFrom(repo.getOptions())).resolves.toMatchObject({
      eligible: false,
      eligibilityReason: 'PROGRAM_SUSPENSION',
    });

    store.setScenario('empty-invalid');
    const empty = await firstValueFrom(repo.getRequirements('GRADO'));
    expect(empty.requirements).toEqual([]);
  });

  it('returns a maestria panel with three loaded documents and pending count 2', async () => {
    store.setScenario('maestria-parcial');

    const panel = await firstValueFrom(repo.getPanel('GRADO'));
    const loaded = panel.requirements.filter((item) => item.status === 'CARGADO');
    const pending = panel.requirements.filter((item) => item.status === 'PENDIENTE');

    expect(panel.requiredPendingCount).toBe(2);
    expect(loaded).toHaveLength(3);
    expect(pending).toHaveLength(2);
    expect(panel.request).toMatchObject({
      id: 41,
      status: 'BORRADOR',
      folio: null,
      version: 3,
      delivery: null,
    });
  });

  it('saves a first draft without folio and increments version once', async () => {
    store.setScenario('maestria-emanuel');
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );

    const saved = await firstValueFrom(
      repo.saveDocuments('GRADO', 0, [{ documentType: 'TESIS', kind: 'PDF', file }]),
    );

    expect(saved.version).toBe(1);
    expect(saved.request).toMatchObject({ status: 'BORRADOR', folio: null, submittedAt: null });
    expect(saved.results[0]?.status).toBe('SAVED');

    const panel = await firstValueFrom(repo.getPanel('GRADO'));
    expect(panel.requirements.find((item) => item.documentType === 'TESIS')?.status).toBe(
      'CARGADO',
    );
  });

  it('returns mixed 200 results and keeps only the saved document', async () => {
    store.setScenario('maestria-emanuel');
    const thesis = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );
    const history = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'historia.pdf');

    const saved = await firstValueFrom(
      repo.saveDocuments('GRADO', 0, [
        { documentType: 'TESIS', kind: 'PDF', file: thesis },
        { documentType: 'HIST_ACAD', kind: 'PDF', file: history },
      ]),
    );

    expect(saved.results).toEqual([
      expect.objectContaining({ documentType: 'TESIS', status: 'SAVED' }),
      expect.objectContaining({
        documentType: 'HIST_ACAD',
        status: 'ERROR',
        error: expect.objectContaining({
          error: 'INVALID_DOCUMENT_NAME',
          details: { expectedName: 'Hist_Acad_Lopez_Alba_Emanuel.pdf' },
        }),
      }),
    ]);
    expect(saved.request?.folio).toBeNull();
    expect(saved.version).toBe(1);

    const panel = await firstValueFrom(repo.getPanel('GRADO'));
    expect(panel.requirements.find((item) => item.documentType === 'TESIS')?.status).toBe(
      'CARGADO',
    );
    expect(panel.requirements.find((item) => item.documentType === 'HIST_ACAD')?.status).toBe(
      'PENDIENTE',
    );
  });

  it('rejects a stale version and a non-draft delete', async () => {
    store.setScenario('maestria-parcial');
    await expect(
      firstValueFrom(
        repo.saveDocuments('GRADO', 0, [
          {
            documentType: 'DATOS_ALUM',
            kind: 'PDF',
            file: new File([new Uint8Array([0x25])], 'Datos_Alum_Lopez_Alba_Emanuel.pdf'),
          },
        ]),
      ),
    ).rejects.toMatchObject({ status: 409, error: { error: 'VERSION_CONFLICT' } });

    store.setScenario('doctorado');
    await expect(
      firstValueFrom(repo.deleteDocument('PREDOCTORAL', 'TESIS', { version: 1 })),
    ).rejects.toMatchObject({ status: 409, error: { error: 'REQUEST_NOT_DRAFT' } });
  });

  it('replaces and deletes a draft document using CAS', async () => {
    store.setScenario('maestria-parcial');
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );

    const replaced = await firstValueFrom(
      repo.replaceDocument('GRADO', 'TESIS', { kind: 'PDF', version: 3, file }),
    );
    expect(replaced.version).toBe(4);
    expect(replaced.document?.originalName).toBe('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');
    expect(replaced.request.folio).toBeNull();

    const deleted = await firstValueFrom(repo.deleteDocument('GRADO', 'TESIS', { version: 4 }));
    expect(deleted.version).toBe(5);
    expect(deleted.document).toBeNull();
    expect(deleted.request.requirements.find((item) => item.documentType === 'TESIS')?.status).toBe(
      'PENDIENTE',
    );
  });

  it('returns 404 DOCUMENT_NOT_FOUND when deleting a missing file', async () => {
    store.setScenario('maestria-parcial');
    await expect(
      firstValueFrom(repo.deleteDocument('GRADO', 'DATOS_ALUM', { version: 3 })),
    ).rejects.toMatchObject({ status: 404, error: { error: 'DOCUMENT_NOT_FOUND' } });
  });

  it('returns the same PDF fixture for inline and attachment', async () => {
    store.setScenario('maestria-parcial');

    const inline = await firstValueFrom(repo.getDocumentContent('GRADO', 'TESIS', 'inline'));
    const attachment = await firstValueFrom(
      repo.getDocumentContent('GRADO', 'TESIS', 'attachment'),
    );

    expect(inline.type).toBe('application/pdf');
    expect(attachment.type).toBe('application/pdf');
    expect(new Uint8Array(await inline.arrayBuffer())).toEqual(EXAM_DOCUMENT_PDF_FIXTURE);
    expect(new Uint8Array(await attachment.arrayBuffer())).toEqual(EXAM_DOCUMENT_PDF_FIXTURE);
    expect(String.fromCharCode(...EXAM_DOCUMENT_PDF_FIXTURE.slice(0, 5))).toBe('%PDF-');
  });

  it('returns 404 when the current document does not exist', async () => {
    store.setScenario('maestria-emanuel');

    await expect(
      firstValueFrom(repo.getDocumentContent('GRADO', 'TESIS', 'inline')),
    ).rejects.toMatchObject({
      status: 404,
      error: { error: 'DOCUMENT_NOT_FOUND', message: 'Document not found' },
    });
  });

  it('returns 409 when the current article is an external URL', async () => {
    store.setScenario('doctorado');
    await firstValueFrom(
      repo.saveDocuments('GRADO', 1, [
        {
          documentType: 'ARTICULO',
          kind: 'URL',
          url: 'https://revista.ejemplo.org/articulo/123',
        },
      ]),
    );

    await expect(
      firstValueFrom(repo.getDocumentContent('GRADO', 'ARTICULO', 'inline')),
    ).rejects.toMatchObject({
      status: 409,
      error: { error: 'DOCUMENT_IS_EXTERNAL_URL' },
    });
  });

  it('returns 401 and 503 content faults without PDF bytes', async () => {
    store.setScenario('maestria-parcial');
    store.setContentFault('unauthorized');
    await expect(
      firstValueFrom(repo.getDocumentContent('GRADO', 'TESIS', 'inline')),
    ).rejects.toMatchObject({ status: 401, error: { error: 'UNAUTHORIZED' } });

    store.setContentFault('storage_unavailable');
    await expect(
      firstValueFrom(repo.getDocumentContent('GRADO', 'TESIS', 'attachment')),
    ).rejects.toMatchObject({
      status: 503,
      error: { error: 'DOCUMENT_STORAGE_UNAVAILABLE' },
    });
  });
});
