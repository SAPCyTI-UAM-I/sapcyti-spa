import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';

import { AuthStateService } from '../core/auth/auth.service';
import { EnrollmentSurveyService } from '../features/enrollment-survey/services/enrollment-survey.service';
import { ExamRequestService } from '../features/exam-requests/services/exam-request.service';
import { ExamOptionsDto } from '../models';
import {
  BreadcrumbComponent,
  LanguageSwitcherComponent,
  UserMenuComponent,
} from '../shared/components';
import { ShellMobileDrawerComponent } from './shell-mobile-drawer.component';
import { ShellSidebarNavComponent } from '../shared/components';
import { buildBreadcrumbTrail } from './breadcrumb';
import { getShellNavigation, STUDENT_SURVEY_SECTION } from './shell-menu.config';
import { ShellNavLink, ShellNavSection } from './shell-menu.model';
import { getUserMenuItems } from './user-menu.config';
import { logoutAndNavigateToLogin } from '../core/auth/utils';
import { readStoredBoolean, writeStoredBoolean } from '../shared/utils/local-storage.util';

const SIDEBAR_COLLAPSED_KEY = 'sapcyti.shell.sidebarCollapsed';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterOutlet,
    TranslateModule,
    Button,
    IconField,
    InputIcon,
    InputText,
    BreadcrumbComponent,
    LanguageSwitcherComponent,
    ShellMobileDrawerComponent,
    ShellSidebarNavComponent,
    UserMenuComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly surveys = inject(EnrollmentSurveyService);
  private readonly examRequests = inject(ExamRequestService);

  readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: null });
  readonly mobileMenuOpen = signal(false);
  readonly searchQuery = signal('');
  readonly userMenuItems = computed(() => getUserMenuItems(this.currentUser()?.role));
  readonly sidebarCollapsed = signal(readStoredBoolean(SIDEBAR_COLLAPSED_KEY));

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  readonly breadcrumbs = computed(() => {
    this.navigationEnd();
    return buildBreadcrumbTrail(this.router.routerState.snapshot.root);
  });

  /**
   * HU-41 — re-queries GET /active on every navigation for a STUDENT. A 404 (no active
   * survey) is swallowed to `false` in the service/here, so the menu entry just doesn't
   * render — it never surfaces as an error.
   */
  private readonly studentSurveyActive = toSignal(
    toObservable(this.currentUser).pipe(
      switchMap((user) =>
        user?.role === 'STUDENT'
          ? this.router.events.pipe(
              filter((event) => event instanceof NavigationEnd),
              startWith(null),
              switchMap(() =>
                this.surveys.getActiveSurvey().pipe(
                  map((form) => form !== null),
                  catchError(() => of(false)),
                ),
              ),
            )
          : of(false),
      ),
    ),
    { initialValue: false },
  );

  /**
   * HU-62 — consulta GET /exam-requests/me/options para deshabilitar el ítem
   * exam-request si el programa está en BAJA o SUSPENSION. Un fallo de red
   * deja el ítem habilitado para no inferir el estatus.
   */
  private readonly examOptions = toSignal(
    toObservable(this.currentUser).pipe(
      switchMap((user) =>
        user?.role === 'STUDENT'
          ? this.router.events.pipe(
              filter((event) => event instanceof NavigationEnd),
              startWith(null),
              switchMap(() => this.examRequests.getOptions().pipe(catchError(() => of(null)))),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  readonly navigation = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return null;
    }
    const base = getShellNavigation(user.role);
    if (!base) {
      return null;
    }

    let sections = [...base.sections];
    if (user.role === 'STUDENT' && this.studentSurveyActive()) {
      sections = [...sections, STUDENT_SURVEY_SECTION];
    }
    if (user.role === 'STUDENT') {
      sections = applyExamRequestEligibility(sections, this.examOptions());
    }
    return { ...base, sections };
  });

  readonly userInitials = computed(() => {
    const email = this.currentUser()?.email ?? '';
    const local = email.split('@')[0] ?? '';
    return local.slice(0, 2).toUpperCase() || 'U';
  });

  readonly searchableLinks = computed(() => {
    const navigation = this.navigation();
    if (!navigation) {
      return [];
    }

    return [navigation.home, ...navigation.sections.flatMap((section) => section.items)].filter(
      (link) => !link.disabled,
    );
  });

  readonly searchResults = computed(() => {
    const query = this.normalizeSearch(this.searchQuery());
    if (query.length < 2) {
      return [];
    }

    return this.searchableLinks()
      .map((link) => ({
        ...link,
        label: this.translate.instant(link.labelKey) as string,
      }))
      .filter((link) => {
        const label = this.normalizeSearch(link.label);
        const route = this.normalizeSearch(link.route);
        const id = this.normalizeSearch(link.id);
        return label.includes(query) || route.includes(query) || id.includes(query);
      })
      .slice(0, 6);
  });

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSearchSubmit(): void {
    const [firstResult] = this.searchResults();
    if (firstResult) {
      this.navigateToSearchResult(firstResult.route);
    }
  }

  navigateToSearchResult(route: string): void {
    this.searchQuery.set('');
    void this.router.navigateByUrl(route);
  }

  onLogout(): void {
    logoutAndNavigateToLogin(this.auth, this.router);
  }

  toggleSidebar(): void {
    const collapsed = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(collapsed);
    writeStoredBoolean(SIDEBAR_COLLAPSED_KEY, collapsed);
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}

/** Aplica disabled + clave de motivo al ítem exam-request según las opciones del alumno. */
function applyExamRequestEligibility(
  sections: readonly ShellNavSection[],
  options: ExamOptionsDto | null,
): ShellNavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => withExamRequestEligibility(item, options)),
  }));
}

function withExamRequestEligibility(
  item: ShellNavLink,
  options: ExamOptionsDto | null,
): ShellNavLink {
  if (item.id !== 'exam-request' || !options || options.eligible) {
    return item;
  }

  const disabledReasonKey =
    options.eligibilityReason === 'PROGRAM_BAJA'
      ? 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_BAJA'
      : options.eligibilityReason === 'PROGRAM_SUSPENSION'
        ? 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_SUSPENSION'
        : 'EXAM_REQUEST.ERRORS.PROGRAM_NOT_ELIGIBLE';

  return { ...item, disabled: true, disabledReasonKey };
}
