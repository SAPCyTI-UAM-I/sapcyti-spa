import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { AuthStateService } from '../core/auth/auth.service';
import { EnrollmentSurveyService } from '../features/enrollment-survey/services/enrollment-survey.service';
import { ExamRequestService } from '../features/exam-requests/services/exam-request.service';
import { CurrentUser, ExamOptionsDto } from '../models';
import { ShellComponent } from './shell.component';
import { ShellNavLink } from './shell-menu.model';

const student: CurrentUser = {
  id: 1,
  email: 'student@uam.mx',
  role: 'STUDENT',
  graduateProgramId: 1,
};

function eligibleOptions(): ExamOptionsDto {
  return {
    degree: 'MAESTRIA',
    programStatus: 'EN_INVESTIGACION',
    eligible: true,
    eligibilityReason: null,
    examTypes: ['GRADO'],
  };
}

function createShell(examOptions$ = of(eligibleOptions())) {
  const authMock = {
    currentUser$: new BehaviorSubject<CurrentUser | null>(null),
    logout: vi.fn(() => of(void 0)),
  };
  const surveyMock = { getActiveSurvey: vi.fn(() => of(null)) };
  const examMock = { getOptions: vi.fn(() => examOptions$) };

  TestBed.configureTestingModule({
    imports: [ShellComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideRouter([]),
      { provide: AuthStateService, useValue: authMock },
      { provide: EnrollmentSurveyService, useValue: surveyMock },
      { provide: ExamRequestService, useValue: examMock },
    ],
  });

  const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ShellComponent);
  return { fixture, component: fixture.componentInstance, authMock, examMock, navigateByUrl };
}

function examRequestItem(component: ShellComponent): ShellNavLink | undefined {
  return component
    .navigation()
    ?.sections.flatMap((section) => section.items)
    .find((item) => item.id === 'exam-request');
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

  it('keeps the exam-request item enabled when the student is eligible', () => {
    const { component, authMock } = createShell();
    authMock.currentUser$.next(student);
    TestBed.flushEffects();

    const item = examRequestItem(component);
    expect(item).toBeDefined();
    expect(item?.disabled).toBeUndefined();
    expect(component.searchableLinks().some((link) => link.id === 'exam-request')).toBe(true);
  });

  it('disables the exam-request item when the program is BAJA', () => {
    const { component, authMock } = createShell(
      of({
        ...eligibleOptions(),
        programStatus: 'BAJA',
        eligible: false,
        eligibilityReason: 'PROGRAM_BAJA',
      }),
    );
    authMock.currentUser$.next(student);
    TestBed.flushEffects();

    const item = examRequestItem(component);
    expect(item?.disabled).toBe(true);
    expect(item?.disabledReasonKey).toBe('EXAM_REQUEST.ELIGIBILITY.PROGRAM_BAJA');
    expect(component.searchableLinks().some((link) => link.id === 'exam-request')).toBe(false);
  });

  it('disables the exam-request item when the program is SUSPENSION', () => {
    const { component, authMock } = createShell(
      of({
        ...eligibleOptions(),
        programStatus: 'SUSPENSION',
        eligible: false,
        eligibilityReason: 'PROGRAM_SUSPENSION',
      }),
    );
    authMock.currentUser$.next(student);
    TestBed.flushEffects();

    const item = examRequestItem(component);
    expect(item?.disabled).toBe(true);
    expect(item?.disabledReasonKey).toBe('EXAM_REQUEST.ELIGIBILITY.PROGRAM_SUSPENSION');
  });

  it('keeps the exam-request item enabled when options fail to load', () => {
    const { component, authMock } = createShell(throwError(() => new Error('network')));
    authMock.currentUser$.next(student);
    TestBed.flushEffects();

    const item = examRequestItem(component);
    expect(item?.disabled).toBeFalsy();
    expect(component.searchableLinks().some((link) => link.id === 'exam-request')).toBe(true);
  });

  it('does not query exam options for non-student roles', () => {
    const { authMock, examMock } = createShell();
    authMock.currentUser$.next({
      id: 2,
      email: 'coord@uam.mx',
      role: 'COORDINATOR',
      graduateProgramId: 1,
    });
    TestBed.flushEffects();

    expect(examMock.getOptions).not.toHaveBeenCalled();
  });
});
