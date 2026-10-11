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
