import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authState: { requestPasswordReset: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(): Promise<void> {
    authState = {
      requestPasswordReset: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authState }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  }

  it('navigates to sent screen on successful submit', async () => {
    await setup();
    component.form.patchValue({ email: 'student@uam.mx' });

    component.onSubmit();

    expect(authState.requestPasswordReset).toHaveBeenCalledWith('student@uam.mx');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forgot-password/sent']);
    expect(component.serverError()).toBe(false);
  });

  it('navigates to sent screen on 4xx to preserve anti-enumeration behavior', async () => {
    await setup();
    authState.requestPasswordReset.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: { message: 'Invalid email format' },
          }),
      ),
    );
    component.form.patchValue({ email: 'student@uam.mx' });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/forgot-password/sent']);
    expect(component.serverError()).toBe(false);
  });

  it('shows server error on 5xx or network failure', async () => {
    await setup();
    authState.requestPasswordReset.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })),
    );
    component.form.patchValue({ email: 'student@uam.mx' });

    component.onSubmit();

    expect(component.serverError()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalledWith(['/auth/forgot-password/sent']);
  });
});
