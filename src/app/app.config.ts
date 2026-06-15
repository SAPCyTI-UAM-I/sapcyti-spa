import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';

import { SapcytiPreset } from './core/theme/sapcyti-preset';

import { routes } from './app.routes';
import { AuthStateService } from './core/auth/auth.service';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { jwtInterceptor } from './core/http/jwt.interceptor';
import { tenantInterceptor } from './core/http/tenant.interceptor';
import { provideAppMockConfig } from './core/mocks/mock.config';
import { DATA_LAYER_PROVIDERS } from './core/api/data-layer.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() =>
      firstValueFrom(inject(AuthStateService).restoreRememberedSession()),
    ),
    provideHttpClient(withInterceptors([jwtInterceptor, tenantInterceptor, httpErrorInterceptor])),
    provideAppMockConfig(environment.mocks),
    ...DATA_LAYER_PROVIDERS,
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
