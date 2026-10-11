import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

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
});
