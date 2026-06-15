import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { PasswordChangeService } from '../services/password-change.service';
import { PasswordChangeComponent } from './password-change.component';

describe('PasswordChangeComponent', () => {
  async function createComponent(userId: string | null, returnUrl: string | null = null) {
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
              queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
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
});
