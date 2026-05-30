import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
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
    IconField,
    InputIcon,
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

  readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: null });
  readonly mobileMenuOpen = signal(false);

  readonly navigation = computed(() => {
    const user = this.currentUser();
    return user ? getShellNavigation(user.role) : null;
  });

  readonly userInitials = computed(() => {
    const email = this.currentUser()?.email ?? '';
    const local = email.split('@')[0] ?? '';
    return local.slice(0, 2).toUpperCase() || 'U';
  });

  onLogout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
