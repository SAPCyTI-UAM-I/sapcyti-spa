import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

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

  async function setup() {
    const getProfessor = vi.fn(() => of(professor));
    const deactivateProfessor = vi.fn(() => of({ ...professor, active: false }));

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
        { provide: ProfessorService, useValue: { getProfessor, deactivateProfessor } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfessorDetailComponent);
    return { fixture, getProfessor, deactivateProfessor };
  }

  it('loads professor detail', async () => {
    const { fixture, getProfessor } = await setup();
    fixture.detectChanges();

    expect(getProfessor).toHaveBeenCalledWith(11);
    expect(fixture.componentInstance.professor()?.firstName).toBe('Laura');
  });

  it('deactivates professor after confirmation', async () => {
    const { fixture, deactivateProfessor } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.openDeactivateDialog();
    fixture.componentInstance.confirmDeactivate();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(deactivateProfessor).toHaveBeenCalledWith(11);
    expect(fixture.componentInstance.professor()?.active).toBe(false);
  });

  it('maps blocked deactivation errors', async () => {
    const getProfessor = vi.fn(() => of(professor));
    const deactivateProfessor = vi.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              error: 'CONFLICT',
              message: 'Professor is tutor or advisor of an active student program',
            },
          }),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [ProfessorDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'professorId' ? '10' : null),
              },
            },
          },
        },
        MessageService,
        { provide: ProfessorService, useValue: { getProfessor, deactivateProfessor } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfessorDetailComponent);
    fixture.detectChanges();

    fixture.componentInstance.openDeactivateDialog();
    fixture.componentInstance.confirmDeactivate();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.deactivateError()).toBe('professor_has_active_assignments');
  });
});
