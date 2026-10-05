import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { minLengthRemaining, shouldShowFieldError } from '../../../shared/utils/field-error.util';
import { PasswordChangeService } from '../services/password-change.service';
import { PasswordChangeComponent } from './password-change.component';

describe('PasswordChangeComponent', () => {
  async function createComponent(
    userId: string | null,
    returnUrl: string | null = null,
    targetName: string | null = null,
  ) {
    const queryParams: Record<string, string> = {};
    if (returnUrl) {
      queryParams['returnUrl'] = returnUrl;
    }
    if (targetName) {
      queryParams['targetName'] = targetName;
    }

    const service = { changePassword: vi.fn(() => of(void 0)) };
    const auth = {
      getCurrentUser: () => ({ id: 4 }),
      logout: vi.fn(() => of(void 0)),
    };
    await TestBed.configureTestingModule({
      imports: [PasswordChangeComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PasswordChangeService, useValue: service },
        { provide: AuthStateService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(userId ? { userId } : {}),
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    }).compileComponents();
    return {
      component: TestBed.createComponent(PasswordChangeComponent).componentInstance,
      service,
      auth,
      router: TestBed.inject(Router),
    };
  }

  it('requires current password in self mode and logs out after success', async () => {
    const { component, service, auth, router } = await createComponent(null);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.form.patchValue({
      currentPassword: 'password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });
    component.submit();
    expect(service.changePassword).toHaveBeenCalledWith(
      4,
      { currentPassword: 'password', newPassword: 'new-password' },
      true,
    );
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('uses targetName from query params in admin mode', async () => {
    const { component } = await createComponent('101', null, 'Ana García López');
    expect(component.targetDisplayName).toBe('Ana García López');
  });

  it('falls back to user id when targetName is missing in admin mode', async () => {
    const { component } = await createComponent('101');
    expect(component.targetDisplayName).toBe('101');
  });

  it('omits current password and returns to professor catalog in admin mode', async () => {
    const { component, service, router } = await createComponent(
      '201',
      '/academic-catalog/professors',
    );
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.form.patchValue({
      newPassword: 'temporary-password',
      confirmPassword: 'temporary-password',
    });
    component.submit();
    expect(service.changePassword).toHaveBeenCalledWith(
      201,
      { currentPassword: undefined, newPassword: 'temporary-password' },
      false,
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/academic-catalog/professors');
  });

  it('does not submit mismatched passwords', async () => {
    const { component, service } = await createComponent(null);
    component.form.patchValue({
      currentPassword: 'password',
      newPassword: 'new-password',
      confirmPassword: 'different-password',
    });
    component.submit();
    expect(service.changePassword).not.toHaveBeenCalled();
  });

  it('reports remaining characters reactively as the new password is typed', async () => {
    const { component } = await createComponent(null);
    component.form.controls.newPassword.patchValue('short');
    component.form.controls.newPassword.markAsDirty();
    expect(shouldShowFieldError(component.form.controls.newPassword, component.submitted())).toBe(
      true,
    );
    expect(minLengthRemaining(component.form.controls.newPassword)).toBe(3);

    component.form.controls.newPassword.patchValue('LongEnough1!');
    expect(minLengthRemaining(component.form.controls.newPassword)).toBeNull();
    expect(shouldShowFieldError(component.form.controls.newPassword, component.submitted())).toBe(
      false,
    );
  });

  it('shows mismatch reactively while typing and clears it once they match', async () => {
    const { component } = await createComponent(null);
    component.form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'Different1!' });
    expect(component.passwordsMismatch()).toBe(true);
    expect(component.confirmFieldInvalid()).toBe(true);

    component.form.patchValue({ confirmPassword: 'ValidPass1!' });
    expect(component.passwordsMismatch()).toBe(false);
    expect(component.confirmFieldInvalid()).toBe(false);
  });

  it('maps current-password error code to the current_password error', async () => {
    const { component, service } = await createComponent(null);
    service.changePassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: { code: 'CURRENT_PASSWORD_INCORRECT' },
          }),
      ),
    );
    component.form.patchValue({
      currentPassword: 'wrong-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });
    component.submit();
    expect(component.error()).toBe('current_password');
  });

  it('maps production validation message for wrong current password', async () => {
    const { component, service } = await createComponent(null);
    service.changePassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              error: 'VALIDATION_ERROR',
              message: 'Current password is incorrect',
            },
          }),
      ),
    );
    component.form.patchValue({
      currentPassword: 'wrong-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });
    component.submit();
    expect(component.error()).toBe('current_password');
  });

  it('maps a 404 response to the user_not_found error', async () => {
    const { component, service } = await createComponent('201');
    service.changePassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    component.form.patchValue({
      newPassword: 'temporary-password',
      confirmPassword: 'temporary-password',
    });
    component.submit();
    expect(component.error()).toBe('user_not_found');
  });

  it('falls back to a server error on unexpected failures', async () => {
    const { component, service } = await createComponent(null);
    service.changePassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })),
    );
    component.form.patchValue({
      currentPassword: 'password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });
    component.submit();
    expect(component.error()).toBe('server');
  });
});
