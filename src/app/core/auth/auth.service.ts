import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { CurrentUser } from '../../models/current-user.model';

// TODO: Phase 6 — implement real JWT token lifecycle, silent refresh
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  isAuthenticated(): boolean {
    return false;
  }

  hasRole(role: string): boolean {
    void role;
    return false;
  }

  login(email: string, password: string): Observable<void> {
    void email;
    void password;
    return of(void 0);
  }

  logout(): void {
    // no-op — Phase 6
  }
}
