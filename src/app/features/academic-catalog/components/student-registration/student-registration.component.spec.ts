import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { provideAppMockConfig } from '../../../../core/mocks/mock.config';
import { StudentService } from '../../services/student.service';
import { StudentRegistrationComponent } from './student-registration.component';

describe('StudentRegistrationComponent', () => {
  let fixture: ComponentFixture<StudentRegistrationComponent>;
  let component: StudentRegistrationComponent;
  let studentService: {
    registerStudent: ReturnType<typeof vi.fn>;
  };
  let messageService: MessageService;
  let router: Router;

  beforeEach(async () => {
    studentService = {
      registerStudent: vi.fn(() =>
        of({
          id: 123,
          firstName: 'Juan',
          firstLastName: 'Pérez',
          secondLastName: 'García',
          email: 'juan@uam.mx',
          nationality: 'MEXICAN',
          enrollmentId: '220300456',
          undergraduateDegree: 'Computación',
          programType: 'MASTER',
          admissionDate: '2026-06-12',
          tempPassword: 'mocked-password-123',
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [StudentRegistrationComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StudentService, useValue: studentService },
        provideAppMockConfig({ studentRegistration: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentRegistrationComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    router = TestBed.inject(Router);
    
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(messageService, 'add');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an invalid form', () => {
    expect(component.form.valid).toBe(false);
  });

  it('should validate email format and maxLength', () => {
    const emailCtrl = component.form.controls.email;
    emailCtrl.setValue('invalid-email');
    expect(emailCtrl.hasError('email')).toBe(true);

    emailCtrl.setValue('a@b.com');
    expect(emailCtrl.valid).toBe(true);
  });

  it('should validate enrollmentId pattern (9-10 digits)', () => {
    const enrollmentIdCtrl = component.form.controls.enrollmentId;
    enrollmentIdCtrl.setValue('123456');
    expect(enrollmentIdCtrl.hasError('pattern')).toBe(true);

    enrollmentIdCtrl.setValue('12345678901');
    expect(enrollmentIdCtrl.hasError('pattern')).toBe(true);

    enrollmentIdCtrl.setValue('220300456');
    expect(enrollmentIdCtrl.valid).toBe(true);
  });

  it('should not call StudentService if form is invalid', () => {
    component.onSubmit();
    expect(studentService.registerStudent).not.toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Error de validación' })
    );
  });

  it('should register student and display success dialog with temp password on successful submit', () => {
    component.form.patchValue({
      firstName: 'Juan',
      firstLastName: 'Pérez',
      secondLastName: 'García',
      email: 'juan@uam.mx',
      nationality: 'MEXICAN',
      enrollmentId: '220300456',
      undergraduateDegree: 'Computación',
      programType: 'MASTER',
      admissionDate: new Date(2026, 5, 12),
    });

    component.onSubmit();

    expect(studentService.registerStudent).toHaveBeenCalledWith({
      firstName: 'Juan',
      firstLastName: 'Pérez',
      secondLastName: 'García',
      email: 'juan@uam.mx',
      nationality: 'MEXICAN',
      enrollmentId: '220300456',
      undergraduateDegree: 'Computación',
      programType: 'MASTER',
      admissionDate: '2026-06-12', // local formatting helper converts Date to local YYYY-MM-DD
    });

    expect(component.showPasswordDialog()).toBe(true);
    expect(component.generatedPassword()).toBe('mocked-password-123');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Registro Exitoso' })
    );
  });

  it('should show detailed conflict error on HTTP 409', () => {
    studentService.registerStudent.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 }))
    );

    component.form.patchValue({
      firstName: 'Juan',
      firstLastName: 'Pérez',
      secondLastName: 'García',
      email: 'juan@uam.mx',
      nationality: 'MEXICAN',
      enrollmentId: '220300456',
      undergraduateDegree: 'Computación',
      programType: 'MASTER',
      admissionDate: new Date(2026, 5, 12),
    });

    component.onSubmit();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'El correo electrónico o la matrícula ya están registrados en el sistema.',
      })
    );
  });

  it('should navigate to dashboard on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should reset form and dialog states on closeSuccessDialog', () => {
    component.generatedPassword.set('temp');
    component.showPasswordDialog.set(true);
    component.submitted.set(true);

    component.closeSuccessDialog();

    expect(component.showPasswordDialog()).toBe(false);
    expect(component.generatedPassword()).toBe('');
    expect(component.submitted()).toBe(false);
    expect(component.form.pristine).toBe(true);
  });

  it('should copy password to clipboard and trim trailing/leading spaces', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    component.generatedPassword.set(' test-pwd  ');
    
    component.copyPasswordToClipboard();

    expect(clipboardSpy).toHaveBeenCalledWith('test-pwd');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info', summary: 'Copiado' })
    );
  });
});
