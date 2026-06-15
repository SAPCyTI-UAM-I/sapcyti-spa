import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';

import { AuthStateService } from '../core/auth/auth.service';
import { ShellComponent } from './shell.component';

function createShell() {
  const authMock = {
    currentUser$: new BehaviorSubject(null),
    logout: vi.fn(() => of(void 0)),
  };
  const routerMock = { navigateByUrl: vi.fn() };
  const translateMock = {
    instant: vi.fn((key: string) => key),
    use: vi.fn(),
    onLangChange: new BehaviorSubject(null),
  };

  TestBed.configureTestingModule({
    imports: [ShellComponent],
    providers: [
      { provide: AuthStateService, useValue: authMock },
      { provide: Router, useValue: routerMock },
      { provide: TranslateService, useValue: translateMock },
    ],
  });

  const component = TestBed.createComponent(ShellComponent).componentInstance;
  return { component, authMock, routerMock };
}

describe('ShellComponent', () => {
  afterEach(() => localStorage.clear());

  it('calls async logout and navigates to login on completion', () => {
    const { component, authMock, routerMock } = createShell();

    component.onLogout();

    expect(authMock.logout).toHaveBeenCalledTimes(1);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('toggles the sidebar collapsed state and persists it', () => {
    const { component } = createShell();
    expect(component.sidebarCollapsed()).toBe(false);

    component.toggleSidebar();

    expect(component.sidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('sapcyti.shell.sidebarCollapsed')).toBe('true');

    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(false);
  });
});
