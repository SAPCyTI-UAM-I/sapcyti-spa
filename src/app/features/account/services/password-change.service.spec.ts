import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { DATA_LAYER_PROVIDERS } from '../../../core/api/data-layer.providers';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { PasswordChangeService } from './password-change.service';

describe('PasswordChangeService', () => {
  it('sends self and administrative payloads to the target URL', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ passwordChange: false }),
        ...DATA_LAYER_PROVIDERS,
        PasswordChangeService,
      ],
    });
    const service = TestBed.inject(PasswordChangeService);
    const http = TestBed.inject(HttpTestingController);

    service
      .changePassword(50, { currentPassword: 'old-password', newPassword: 'new-password' }, true)
      .subscribe();
    const self = http.expectOne(API_ENDPOINTS.userPassword(50));
    expect(self.request.method).toBe('PUT');
    expect(self.request.body).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    self.flush(null);

    service.changePassword(51, { newPassword: 'temporary-password' }, false).subscribe();
    const admin = http.expectOne(API_ENDPOINTS.userPassword(51));
    expect(admin.request.body).toEqual({ newPassword: 'temporary-password' });
    admin.flush(null);
    http.verify();
  });

  it('maps an incorrect mock current password to HTTP 400', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ passwordChange: true }),
        ...DATA_LAYER_PROVIDERS,
        PasswordChangeService,
      ],
    });
    const service = TestBed.inject(PasswordChangeService);

    service
      .changePassword(4, { currentPassword: 'wrong', newPassword: 'new-password' }, true)
      .subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.error).toBe('CURRENT_PASSWORD_INCORRECT');
        },
      });
  });
});
