import { inject, InjectionToken, Provider } from '@angular/core';

export interface AppMockConfig {
  readonly auth: boolean;
  readonly passwordRecovery: boolean;
  readonly students: boolean;
  readonly professors: boolean;
  readonly studentPrograms: boolean;
  readonly passwordChange: boolean;
  readonly researchCatalog: boolean;
  readonly ueas: boolean;
}

export type MockFeature = keyof AppMockConfig;

export const DEFAULT_APP_MOCK_CONFIG: AppMockConfig = {
  auth: false,
  passwordRecovery: false,
  students: false,
  professors: false,
  studentPrograms: false,
  passwordChange: false,
  researchCatalog: false,
  ueas: false,
};

export const APP_MOCK_CONFIG = new InjectionToken<AppMockConfig>('APP_MOCK_CONFIG', {
  factory: () => DEFAULT_APP_MOCK_CONFIG,
});

export function provideAppMockConfig(config: Partial<AppMockConfig>): Provider {
  return {
    provide: APP_MOCK_CONFIG,
    useValue: {
      ...DEFAULT_APP_MOCK_CONFIG,
      ...config,
    },
  };
}

export function isMockEnabled(config: AppMockConfig, feature: MockFeature): boolean {
  return config[feature];
}

export function injectMockEnabled(feature: MockFeature): boolean {
  return isMockEnabled(inject(APP_MOCK_CONFIG), feature);
}
