import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="text-on-surface p-4">Login — UI en T6a.4</p>`,
})
export class LoginComponent {}
