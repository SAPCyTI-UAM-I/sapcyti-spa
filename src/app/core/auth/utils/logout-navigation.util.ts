import { Router } from '@angular/router';

import { AuthStateService } from '../auth.service';

export function logoutAndNavigateToLogin(auth: AuthStateService, router: Router): void {
  auth.logout().subscribe({
    complete: () => void router.navigateByUrl('/auth/login'),
  });
}
