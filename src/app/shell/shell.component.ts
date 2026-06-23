import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { filter } from 'rxjs';

import { AuthStateService } from '../core/auth/auth.service';
import {
  BreadcrumbComponent,
  LanguageSwitcherComponent,
  UserMenuComponent,
} from '../shared/components';
import { ShellMobileDrawerComponent } from './shell-mobile-drawer.component';
import { ShellSidebarNavComponent } from '../shared/components';
import { buildBreadcrumbTrail } from './breadcrumb';
import { getShellNavigation } from './shell-menu.config';
import { USER_MENU_ITEMS } from './user-menu.config';
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

  readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: null });
  readonly mobileMenuOpen = signal(false);
  readonly searchQuery = signal('');
  readonly userMenuItems = USER_MENU_ITEMS;
  readonly sidebarCollapsed = signal(readStoredBoolean(SIDEBAR_COLLAPSED_KEY));

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  readonly breadcrumbs = computed(() => {
    this.navigationEnd();
    return buildBreadcrumbTrail(this.router.routerState.snapshot.root);
  });

  readonly navigation = computed(() => {
    const user = this.currentUser();
    return user ? getShellNavigation(user.role) : null;
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

    return [navigation.home, ...navigation.sections.flatMap((section) => section.items)];
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
