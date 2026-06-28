import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { ProfessorService } from '../../services/professor.service';
import { ProfessorEditComponent } from './professor-edit.component';

describe('ProfessorEditComponent', () => {
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

  async function setup() {
    const getProfessor = vi.fn(() => of(professor));
    const updateProfessor = vi.fn(() =>
      of({ ...professor, professorType: 'EXTERNO' as const, employeeNumber: null }),
    );

    await TestBed.configureTestingModule({
      imports: [ProfessorEditComponent, TranslateModule.forRoot(), NoopAnimationsModule],
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
        { provide: ProfessorService, useValue: { getProfessor, updateProfessor } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfessorEditComponent);
    return { fixture, getProfessor, updateProfessor };
  }

  it('loads professor into the form', async () => {
    const { fixture, getProfessor } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getProfessor).toHaveBeenCalledWith(11);
    expect(fixture.componentInstance.form.controls.professorType.value).toBe('INTERNO');
  });

  it('submits update and navigates back to detail', async () => {
    const { fixture, updateProfessor } = await setup();
    fixture.detectChanges();
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.form.patchValue({ professorType: 'EXTERNO' });
    fixture.componentInstance.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(updateProfessor).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ professorType: 'EXTERNO', employeeNumber: null }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/academic-catalog/professors', 11]);
  });
});
