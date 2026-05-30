import { TestBed } from '@angular/core/testing';

import {
  APP_MOCK_CONFIG,
  DEFAULT_APP_MOCK_CONFIG,
  injectMockEnabled,
  isMockEnabled,
  provideAppMockConfig,
} from './mock.config';

describe('mock.config', () => {
  it('uses disabled mocks by default', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(APP_MOCK_CONFIG)).toEqual(DEFAULT_APP_MOCK_CONFIG);
  });

  it('merges provided mock flags with defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideAppMockConfig({ auth: true })],
    });

    const config = TestBed.inject(APP_MOCK_CONFIG);
    expect(config.auth).toBe(true);
    expect(isMockEnabled(config, 'auth')).toBe(true);
  });

  it('can be read from an injection context', () => {
    TestBed.configureTestingModule({
      providers: [provideAppMockConfig({ auth: true })],
    });

    expect(TestBed.runInInjectionContext(() => injectMockEnabled('auth'))).toBe(true);
  });
});
