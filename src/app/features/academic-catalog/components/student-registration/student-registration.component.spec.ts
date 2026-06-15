import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { StudentService } from '../../services/student.service';
import { StudentRegistrationComponent } from './student-registration.component';

describe('StudentRegistrationComponent', () => {
  let fixture: ComponentFixture<StudentRegistrationComponent>;
  let component: StudentRegistrationComponent;
  const service = { registerStudent: vi.fn() };

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
        {
          provide: AuthStateService,
          useValue: { getCurrentUser: () => ({ graduateProgramId: 1 }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StudentRegistrationComponent);
    component = fixture.componentInstance;
  });

  it('validates each step and sends one aligned request on confirmation', () => {
    component.next();
    expect(component.step()).toBe(1);

    component.form.patchValue({
      firstName: 'Ana',
      firstLastName: 'García',
      email: 'ana.new@uam.mx',
      nationality: 'Mexicana',
    });
    component.next();
    expect(component.step()).toBe(2);
    component.form.patchValue({
      enrollmentId: '223300999',
      undergraduateDegree: 'Computación',
      programType: 'MAESTRIA',
      admissionDate: '2026-09-01',
    });
    component.next();
    component.submit();

    expect(service.registerStudent).toHaveBeenCalledTimes(1);
    expect(service.registerStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        graduateProgramId: 1,
        programType: 'MAESTRIA',
        secondLastName: undefined,
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
      enrollmentId: '223300999',
      undergraduateDegree: 'Computación',
      programType: 'MAESTRIA',
      admissionDate: '2026-09-01',
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
