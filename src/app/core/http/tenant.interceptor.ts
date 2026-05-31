import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TenantService } from './tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);
  const programId = tenantService.get();

  if (programId === null) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'X-Graduate-Id': programId.toString() },
    }),
  );
};
