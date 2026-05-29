import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';

import { environment } from '../environments/environment';
import { AUTH_USE_MOCK } from './core/auth/auth.config';

import { SapcytiPreset } from './core/theme/sapcyti-preset';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { tenantInterceptor } from './core/http/tenant.interceptor';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, tenantInterceptor, httpErrorInterceptor])),
    { provide: AUTH_USE_MOCK, useValue: environment.mocks.auth },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: SapcytiPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    ...provideTranslateService({
      lang: 'es',
      fallbackLang: 'es',
    }),
    ...provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json',
      useHttpBackend: true,
    }),
  ],
};
