import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import { AuthStateService } from '../core/auth/auth.service';
import { LanguageSwitcherComponent } from '../shared/components/language-switcher/language-switcher.component';
import { ShellMobileDrawerComponent } from './shell-mobile-drawer.component';
import { ShellSidebarNavComponent } from '../shared/components/shell-sidebar-nav/shell-sidebar-nav.component';
import { getShellNavigation } from './shell-menu.config';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    TranslateModule,
    Avatar,
    Button,
    InputText,
    LanguageSwitcherComponent,
    ShellMobileDrawerComponent,
    ShellSidebarNavComponent,
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
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login');
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
