import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { ResetPasswordComponent } from './reset-password.component';

function makeActivatedRouteStub(token: string | null) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(token ? { token } : {}),
    },
  };
}

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let authState: { resetPassword: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(token: string | null = 'mock-valid-reset-token'): Promise<void> {
    authState = { resetPassword: vi.fn(() => of(void 0)) };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthStateService, useValue: authState },
        { provide: 'ActivatedRoute', useValue: makeActivatedRouteStub(token) },
        provideAppMockConfig({ passwordRecovery: false }),
      ],
    })
      .overrideComponent(ResetPasswordComponent, {
        set: { providers: [{ provide: 'ActivatedRoute', useValue: makeActivatedRouteStub(token) }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;

    vi.spyOn(component['route'].snapshot.queryParamMap, 'get').mockReturnValue(token);

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('shows invalid-token message when no token in URL', async () => {
    await setup(null);
    expect(component.token()).toBeNull();
    expect(authState.resetPassword).not.toHaveBeenCalled();
  });

  it('does not submit when form is empty', async () => {
    await setup();
    component.onSubmit();
    expect(authState.resetPassword).not.toHaveBeenCalled();
    expect(component.newPasswordShowError()).toBe(true);
    expect(component.confirmPasswordShowError()).toBe(true);
  });

  it('does not submit when password is too short', async () => {
    await setup();
    component.form.patchValue({ newPassword: 'short', confirmPassword: 'short' });
    component.onSubmit();
    expect(authState.resetPassword).not.toHaveBeenCalled();
    expect(component.newPasswordShowError()).toBe(true);
  });

  it('shows passwords-mismatch as user types without needing submit', async () => {
    await setup();
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'Different1!' });
    expect(component.passwordsMismatch()).toBe(true);
  });

  it('clears mismatch error when confirm password is corrected', async () => {
    await setup();
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'Different1!' });
    expect(component.passwordsMismatch()).toBe(true);
    component.form.patchValue({ confirmPassword: 'ValidPass1!' });
    expect(component.passwordsMismatch()).toBe(false);
  });

  it('shows newPassword error in real time without submit', async () => {
    await setup();
    component.form.patchValue({ newPassword: 'short' });
    expect(component.newPasswordShowError()).toBe(true);
  });

  it('clears newPassword error when password reaches minimum length', async () => {
    await setup();
    component.form.patchValue({ newPassword: 'short' });
    expect(component.newPasswordShowError()).toBe(true);
    component.form.patchValue({ newPassword: 'LongEnough1!' });
    expect(component.newPasswordShowError()).toBe(false);
  });

  it('calls resetPassword with token and new password on valid submit', async () => {
    await setup('my-token');
    component.token.set('my-token');
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    component.onSubmit();
    expect(authState.resetPassword).toHaveBeenCalledWith('my-token', 'ValidPass1!');
  });

  it('navigates to login on success', async () => {
    await setup('my-token');
    component.token.set('my-token');
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('shows invalid_token error on 400 INVALID_TOKEN', async () => {
    await setup('bad-token');
    component.token.set('bad-token');
    authState.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: { code: 'INVALID_TOKEN' },
          }),
      ),
    );
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    component.onSubmit();
    expect(component.resetError()).toBe('invalid_token');
  });

  it('shows expired_token error on 400 EXPIRED_TOKEN', async () => {
    await setup('expired-token');
    component.token.set('expired-token');
    authState.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: { code: 'EXPIRED_TOKEN' },
          }),
      ),
    );
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    component.onSubmit();
    expect(component.resetError()).toBe('expired_token');
  });

  it('shows server error on unexpected failure', async () => {
    await setup('good-token');
    component.token.set('good-token');
    authState.resetPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })),
    );
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    component.onSubmit();
    expect(component.resetError()).toBe('server');
  });
});
