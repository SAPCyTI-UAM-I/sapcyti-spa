import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Message, Button],
  template: `
    <div class="flex min-h-[60vh] w-full items-start justify-center">
      <section
        class="bg-surface border-outline p-lg md:p-xl gap-lg flex w-full max-w-3xl flex-col rounded-xl border"
      >
        <p-message
          severity="warn"
          [text]="'COMMON.ERRORS.NOT_FOUND' | translate"
          icon="pi pi-compass"
          styleClass="w-full justify-start"
        />

        <p class="text-body-md text-text-secondary font-body-md">
          {{ 'COMMON.ERRORS.NOT_FOUND_MSG' | translate }}
        </p>

        <div>
          <p-button
            [label]="'SHELL.MENU.HOME' | translate"
            icon="pi pi-home"
            (onClick)="goHome()"
            [outlined]="true"
          />
        </div>
      </section>
    </div>
  `,
})
export class NotFoundComponent {
  private readonly router = inject(Router);

  goHome(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
