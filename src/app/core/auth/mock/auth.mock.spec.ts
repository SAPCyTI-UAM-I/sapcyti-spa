import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { mockLogin, mockRequestPasswordReset } from './auth.mock';

describe('auth.mock', () => {
  it('mockLogin resolves for known demo users', async () => {
    const response = await firstValueFrom(mockLogin('student@uam.mx', 'password'));

    expect(response.role).toBe('STUDENT');
    expect(response.accessToken).toContain('.');
  });

  it('mockLogin rejects invalid credentials with 401', async () => {
    await expect(firstValueFrom(mockLogin('student@uam.mx', 'wrong'))).rejects.toSatisfy(
      (error: unknown) => error instanceof HttpErrorResponse && error.status === 401,
    );
  });

  it('mockRequestPasswordReset completes without error', async () => {
    await expect(firstValueFrom(mockRequestPasswordReset('any@uam.mx'))).resolves.toBeUndefined();
  });
});
