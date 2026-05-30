import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authState: {
    login: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    authState = {
      login: vi.fn(() => of(void 0)),
      getCurrentUser: vi.fn(() => ({
        id: 1,
        email: 'student@uam.mx',
        role: 'STUDENT',
        graduateProgramId: 1,
      })),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthStateService, useValue: authState },
        provideAppMockConfig({ auth: false }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render demo accounts when auth mock is disabled', () => {
    expect(component.authMockEnabled).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('student@uam.mx');
  });

  it('does not call login when form is empty', () => {
    component.onSubmit();
    expect(authState.login).not.toHaveBeenCalled();
    expect(component.showFieldError('email')).toBe(true);
    expect(component.showFieldError('password')).toBe(true);
  });

  it('clears the form and error state', () => {
    component.form.patchValue({ email: 'a@b.com', password: 'secret' });
    component.credentialError.set(true);
    component.submitted.set(true);

    component.onClear();

    expect(component.form.getRawValue()).toEqual({
      email: '',
      password: '',
      rememberMe: false,
    });
    expect(component.credentialError()).toBe(false);
    expect(component.submitted()).toBe(false);
  });

  it('shows credential error on 401', () => {
    authState.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );

    component.form.patchValue({ email: 'a@b.com', password: 'wrong' });
    component.onSubmit();

    expect(component.credentialError()).toBe(true);
  });

  it('navigates to dashboard on successful login', () => {
    component.form.patchValue({ email: 'student@uam.mx', password: 'secret' });
    component.onSubmit();

    expect(authState.login).toHaveBeenCalledWith('student@uam.mx', 'secret', false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('allows SPEAKER users to enter the app', () => {
    authState.getCurrentUser.mockReturnValue({
      id: 2,
      email: 'speaker@uam.mx',
      role: 'SPEAKER',
      graduateProgramId: 1,
    });

    component.form.patchValue({ email: 'speaker@uam.mx', password: 'secret' });
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
