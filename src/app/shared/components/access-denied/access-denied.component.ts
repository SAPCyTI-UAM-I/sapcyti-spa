import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-access-denied',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Card, Message, Button, RouterLink],
  template: `
    <div class="flex min-h-[60vh] items-center justify-center p-4">
      <p-card [style]="{ width: '28rem' }">
        <div class="flex flex-col gap-4">
          <p-message
            severity="error"
            [text]="'COMMON.ERRORS.ACCESS_DENIED' | translate"
            icon="pi pi-lock"
            [style]="{ width: '100%', justifyContent: 'flex-start' }"
          />
          <p class="text-surface-600 text-sm">
            {{ 'COMMON.ERRORS.ACCESS_DENIED_MSG' | translate }}
          </p>
          <p-button
            [label]="'COMMON.ACTIONS.BACK' | translate"
            icon="pi pi-arrow-left"
            routerLink="/dashboard"
            [outlined]="true"
          />
        </div>
      </p-card>
    </div>
  `,
})
export class AccessDeniedComponent {}
