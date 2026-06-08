import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AUTH_ENDPOINTS } from '../core/auth/auth.endpoints';
import { AppMockConfig, provideAppMockConfig } from '../core/mocks/mock.config';

export const AUTH_TEST_ENDPOINTS = AUTH_ENDPOINTS;

export const AUTH_STORAGE_KEYS = {
  rememberSession: 'sapcyti.auth.rememberSession',
  rememberedEmail: 'sapcyti.auth.rememberedEmail',
} as const;

export function createTestJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.test-signature`;
}

export function configureAuthHttpTesting(mocks: Partial<AppMockConfig> = { auth: false }): {
  httpMock: HttpTestingController;
} {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideAppMockConfig(mocks)],
  });

  return { httpMock: TestBed.inject(HttpTestingController) };
}

export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEYS.rememberSession);
  localStorage.removeItem(AUTH_STORAGE_KEYS.rememberedEmail);
}
