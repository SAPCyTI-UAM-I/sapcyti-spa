import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { EXAM_STUDENT_OPERATION } from '../../../core/http/tokens/exam-context.tokens';
import { ExamOptionsDto, ExamRequirementsResponse } from '../../../models';
import { ExamRequestHttpRepository } from './exam-request-http.repository';

const options: ExamOptionsDto = {
  degree: 'MAESTRIA',
  programStatus: 'EGRESADO',
  eligible: true,
  eligibilityReason: null,
  examTypes: ['GRADO'],
};

const requirements: ExamRequirementsResponse = {
  examType: 'GRADO',
  degree: 'MAESTRIA',
  programStatus: 'EGRESADO',
  eligible: true,
  eligibilityReason: null,
  request: null,
  requirements: [],
};

describe('ExamRequestHttpRepository', () => {
  let repo: ExamRequestHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ExamRequestHttpRepository],
    });
    repo = TestBed.inject(ExamRequestHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads options from the configured URL without exam write context', async () => {
    const pending = firstValueFrom(repo.getOptions());

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.options);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(false);
    req.flush(options);

    await expect(pending).resolves.toEqual(options);
  });

  it('reads GRADO requirements from the configured URL', async () => {
    const pending = firstValueFrom(repo.getRequirements('GRADO'));

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.requirements('GRADO'));
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(false);
    req.flush(requirements);

    await expect(pending).resolves.toEqual(requirements);
  });

  it('propagates a security 403 FORBIDDEN', async () => {
    const pending = firstValueFrom(repo.getOptions());

    http
      .expectOne(API_ENDPOINTS.examRequests.me.options)
      .flush(
        { error: 'FORBIDDEN', message: 'Access denied' },
        { status: 403, statusText: 'Forbidden' },
      );

    await expect(pending).rejects.toMatchObject({
      status: 403,
      error: { error: 'FORBIDDEN' },
    });
  });

  it('reads the HU-65 panel without exam write context', async () => {
    const panel = {
      ...requirements,
      request: null,
      requiredPendingCount: 5,
    };
    const pending = firstValueFrom(repo.getPanel('GRADO'));

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.panel('GRADO'));
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(false);
    req.flush(panel);

    await expect(pending).resolves.toEqual(panel);
  });

  it('posts multipart save with write context and no manual Content-Type', async () => {
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );
    const pending = firstValueFrom(
      repo.saveDocuments('GRADO', 0, [{ documentType: 'TESIS', kind: 'PDF', file }]),
    );

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.documents('GRADO'));
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(true);
    expect(req.request.body).toBeInstanceOf(FormData);
    expect(req.request.headers.get('Content-Type')).toBeNull();

    const formData = req.request.body as FormData;
    const manifest = formData.get('manifest') as Blob;
    expect(manifest.type).toBe('application/json');
    expect(JSON.parse(await manifest.text())).toEqual({
      version: 0,
      documents: [{ documentType: 'TESIS', kind: 'PDF', filePart: 'file_TESIS' }],
    });
    expect((formData.get('file_TESIS') as File).name).toBe('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');

    req.flush({ request: null, version: 0, results: [] });
    await pending;
  });

  it('puts a PDF replacement as version+file multipart with write context', async () => {
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );
    const pending = firstValueFrom(
      repo.replaceDocument('GRADO', 'TESIS', { kind: 'PDF', version: 3, file }),
    );

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.document('GRADO', 'TESIS'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(true);
    expect(req.request.body).toBeInstanceOf(FormData);
    expect(req.request.headers.get('Content-Type')).toBeNull();

    const formData = req.request.body as FormData;
    expect(formData.get('version')).toBe('3');
    expect((formData.get('file') as File).name).toBe('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');

    req.flush({
      request: {
        id: 41,
        examType: 'GRADO',
        degree: 'MAESTRIA',
        status: 'BORRADOR',
        folio: null,
        version: 4,
        submittedAt: null,
        requirements: [],
        delivery: null,
      },
      version: 4,
      document: null,
    });
    await pending;
  });

  it('puts an article URL as JSON with write context', async () => {
    const pending = firstValueFrom(
      repo.replaceDocument('GRADO', 'ARTICULO', {
        version: 3,
        kind: 'URL',
        externalUrl: 'https://revista.ejemplo.org/articulo/123',
      }),
    );

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.document('GRADO', 'ARTICULO'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(true);
    expect(req.request.body).toEqual({
      version: 3,
      kind: 'URL',
      externalUrl: 'https://revista.ejemplo.org/articulo/123',
    });

    req.flush({
      request: {
        id: 41,
        examType: 'GRADO',
        degree: 'DOCTORADO',
        status: 'BORRADOR',
        folio: null,
        version: 4,
        submittedAt: null,
        requirements: [],
        delivery: null,
      },
      version: 4,
      document: null,
    });
    await pending;
  });

  it('deletes a document with version JSON and write context', async () => {
    const pending = firstValueFrom(repo.deleteDocument('GRADO', 'TESIS', { version: 4 }));

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.document('GRADO', 'TESIS'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(true);
    expect(req.request.body).toEqual({ version: 4 });

    req.flush({
      request: {
        id: 41,
        examType: 'GRADO',
        degree: 'MAESTRIA',
        status: 'BORRADOR',
        folio: null,
        version: 5,
        submittedAt: null,
        requirements: [],
        delivery: null,
      },
      version: 5,
      document: null,
    });
    await pending;
  });

  it('propagates a write 409 VERSION_CONFLICT', async () => {
    const pending = firstValueFrom(
      repo.saveDocuments('GRADO', 0, [
        {
          documentType: 'TESIS',
          kind: 'PDF',
          file: new File([new Uint8Array([0x25])], 'Tesis_Mtria_Lopez_Alba_Emanuel.pdf'),
        },
      ]),
    );

    http
      .expectOne(API_ENDPOINTS.examRequests.me.documents('GRADO'))
      .flush(
        { error: 'VERSION_CONFLICT', message: 'The request was changed by another operation' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(pending).rejects.toMatchObject({
      status: 409,
      error: { error: 'VERSION_CONFLICT' },
    });
  });

  it('propagates a business 403 PROGRAM_NOT_ELIGIBLE', async () => {
    const pending = firstValueFrom(repo.getRequirements('GRADO'));

    http
      .expectOne(API_ENDPOINTS.examRequests.me.requirements('GRADO'))
      .flush(
        { error: 'PROGRAM_NOT_ELIGIBLE', message: 'Program is not eligible' },
        { status: 403, statusText: 'Forbidden' },
      );

    await expect(pending).rejects.toMatchObject({
      status: 403,
      error: { error: 'PROGRAM_NOT_ELIGIBLE' },
    });
  });
});
