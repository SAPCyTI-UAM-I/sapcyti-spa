import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';

import { CopyableTextComponent } from '../copyable-text/copyable-text.component';

export const DEFAULT_SUPPORT_EMAIL = 'soporte@sapcyti.site';

@Component({
  selector: 'app-support-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, Button, CopyableTextComponent],
  templateUrl: './support-banner.component.html',
})
export class SupportBannerComponent {
  readonly email = input<string>(DEFAULT_SUPPORT_EMAIL);
  readonly visible = model<boolean>(true);
  readonly closed = output<void>();

  dismiss(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}
