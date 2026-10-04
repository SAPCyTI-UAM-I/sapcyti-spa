import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

import { CopyableTextComponent } from '../copyable-text/copyable-text.component';

export const DEFAULT_SUPPORT_EMAIL = 'soporte@sapcyti.site';

@Component({
  selector: 'app-support-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, Button, Dialog, CopyableTextComponent],
  templateUrl: './support-dialog.component.html',
})
export class SupportDialogComponent {
  readonly email = input<string>(DEFAULT_SUPPORT_EMAIL);
  readonly visible = model<boolean>(false);
  readonly closed = output<void>();

  dismiss(): void {
    this.visible.set(false);
  }

  onHide(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}
