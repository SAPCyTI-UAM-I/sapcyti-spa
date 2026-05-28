import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Toolbar } from 'primeng/toolbar';

import { LanguageSwitcherComponent } from '../shared/components/language-switcher/language-switcher.component';
import { SHELL_MENU_ITEMS } from './shell-menu.config';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    Toolbar,
    LanguageSwitcherComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  // TODO: Phase 6 — filter by currentUser$.role
  readonly menuItems = SHELL_MENU_ITEMS;
}
