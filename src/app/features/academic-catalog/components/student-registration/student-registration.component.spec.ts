import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { ProfessorService } from '../../services/professor.service';
import { ResearchCatalogService } from '../../services/research-catalog.service';
import { StudentService } from '../../services/student.service';
import { StudentRegistrationComponent } from './student-registration.component';

describe('StudentRegistrationComponent', () => {
  let fixture: ComponentFixture<StudentRegistrationComponent>;
  let component: StudentRegistrationComponent;
  const service = { registerStudent: vi.fn() };
  const professorService = {
    listProfessors: vi.fn().mockReturnValue(
      of({
        content: [
          {
            id: 10,
            firstName: 'Humberto',
            firstLastName: 'Cervantes',
            active: true,
          },
          {
            id: 11,
            firstName: 'Laura',
            firstLastName: 'Martínez',
            active: true,
          },
        ],
      }),
    ),
  };
  const researchCatalogService = {
    getResearchCatalog: vi.fn().mockReturnValue(
      of([
        {
          line: 'Ciencias e Ingeniería de la Computación',
          areas: ['Inteligencia artificial'],
        },
      ]),
    ),
  };

  beforeEach(async () => {
    service.registerStudent.mockReturnValue(
      of({
        id: 3,
        userId: 103,
        active: true,
        generatedPassword: 'Temp1234',
      }),
    );
    await TestBed.configureTestingModule({
      imports: [StudentRegistrationComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: StudentService, useValue: service },
        { provide: ProfessorService, useValue: professorService },
        { provide: ResearchCatalogService, useValue: researchCatalogService },
        {
          provide: AuthStateService,
          useValue: { getCurrentUser: () => ({ graduateProgramId: 1 }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StudentRegistrationComponent);
    component = fixture.componentInstance;
  });

  it('defaults nationality to Mexicana', () => {
    expect(component.form.controls.nationality.value).toBe('Mexicana');
  });

  it('validates each step and sends one aligned request on confirmation', () => {
    component.next();
    expect(component.step()).toBe(1);

    component.form.patchValue({
      firstName: 'Ana',
      firstLastName: 'García',
      email: 'ana.new@uam.mx',
      nationality: 'Mexicana',
      birthDate: '1998-04-12',
      phone: '5512345678',
    });
    component.next();
    expect(component.step()).toBe(2);
    component.form.patchValue({
      enrollmentId: '223300999',
      undergraduateDegree: 'Computación',
      lastDegreeObtained: 'LICENCIATURA',
      programType: 'MAESTRIA',
      admissionDate: '2026-09-01',
      lineOfKnowledge: 'Ciencias e Ingeniería de la Computación',
      researchArea: 'Inteligencia artificial',
      tutorId: 10,
      advisorIds: [11],
    });
    component.next();
    component.submit();

    expect(service.registerStudent).toHaveBeenCalledTimes(1);
    expect(service.registerStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        graduateProgramId: 1,
        programType: 'MAESTRIA',
        secondLastName: undefined,
        lineOfKnowledge: 'Ciencias e Ingeniería de la Computación',
        researchArea: 'Inteligencia artificial',
        tutorId: 10,
        advisorIds: [11],
      }),
    );
    expect(component.generatedPassword()).toBe('Temp1234');
  });

  it('maps duplicate enrollment conflicts', () => {
    service.registerStudent.mockReturnValue(
      throwError(() => ({ status: 409, error: { error: 'ENROLLMENT_ALREADY_EXISTS' } })),
    );
    component.form.setValue({
      firstName: 'Ana',
      firstLastName: 'García',
      secondLastName: '',
      email: 'ana.new@uam.mx',
      nationality: 'Mexicana',
      birthDate: '1998-04-12',
      phone: '5512345678',
      phoneExtension: '',
      enrollmentId: '223300999',
      undergraduateDegree: 'Computación',
      lastDegreeObtained: 'LICENCIATURA',
      programType: 'MAESTRIA',
      admissionDate: '2026-09-01',
      lineOfKnowledge: '',
      researchArea: '',
      tutorId: null,
      advisorIds: [],
    });
    component.submit();
    expect(component.error()).toBe('duplicate_enrollment');
  });

  it('clears the generated password and returns to the catalog', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.generatedPassword.set('secret');
    component.showPasswordDialog.set(true);
    component.closePasswordDialog();
    expect(component.generatedPassword()).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/academic-catalog/students']);
  });
});
