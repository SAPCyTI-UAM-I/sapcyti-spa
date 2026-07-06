import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { ProfessorService } from '../../services/professor.service';
import { ProfessorDetailComponent } from './professor-detail.component';

describe('ProfessorDetailComponent', () => {
  const professor = {
    id: 11,
    userId: 202,
    professorType: 'INTERNO' as const,
    employeeNumber: '30910',
    email: 'laura.martinez@uam.mx',
    graduateProgramId: 1,
    firstName: 'Laura',
    firstLastName: 'Martínez',
    phone: '5544455566',
    commissionMember: false,
    active: true,
  };

  async function setup(
    service: Partial<ProfessorService> = { getProfessor: vi.fn(() => of(professor)) },
  ) {
    await TestBed.configureTestingModule({
      imports: [ProfessorDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'professorId' ? '11' : null),
              },
            },
          },
        },
        MessageService,
        { provide: ProfessorService, useValue: service },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfessorDetailComponent);
    return { fixture };
  }

  it('loads professor detail', async () => {
    const getProfessor = vi.fn(() => of(professor));
    const { fixture } = await setup({ getProfessor });
    fixture.detectChanges();

    expect(getProfessor).toHaveBeenCalledWith(11);
    expect(fixture.componentInstance.professor()?.firstName).toBe('Laura');
  });

  it('restores an inactive professor and reloads the detail (HU-54)', async () => {
    const getProfessor = vi.fn(() => of({ ...professor, active: false }));
    const restoreProfessor = vi.fn(() => of({ ...professor, active: true }));
    const { fixture } = await setup({ getProfessor, restoreProfessor });
    fixture.detectChanges();

    fixture.componentInstance.restore();

    expect(restoreProfessor).toHaveBeenCalledWith(11);
    expect(getProfessor).toHaveBeenCalledTimes(2); // initial load + reload
  });
});
