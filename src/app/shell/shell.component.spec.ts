import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';

import { AuthStateService } from '../core/auth/auth.service';
import { EnrollmentSurveyService } from '../features/enrollment-survey/services/enrollment-survey.service';
import { ShellComponent } from './shell.component';

function createShell() {
  const authMock = {
    currentUser$: new BehaviorSubject(null),
    logout: vi.fn(() => of(void 0)),
  };
  const surveyMock = { getActiveSurvey: vi.fn(() => of(null)) };
  const translateMock = {
    instant: vi.fn((key: string) => key),
    use: vi.fn(),
    onLangChange: new BehaviorSubject(null),
  };

  TestBed.configureTestingModule({
    imports: [ShellComponent],
    providers: [
      provideRouter([]),
      { provide: AuthStateService, useValue: authMock },
      { provide: TranslateService, useValue: translateMock },
      { provide: EnrollmentSurveyService, useValue: surveyMock },
    ],
  });

  const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const component = TestBed.createComponent(ShellComponent).componentInstance;
  return { component, authMock, navigateByUrl };
}

describe('ShellComponent', () => {
  afterEach(() => localStorage.clear());

  it('calls async logout and navigates to login on completion', () => {
    const { component, authMock, navigateByUrl } = createShell();

    component.onLogout();

    expect(authMock.logout).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/login');
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
