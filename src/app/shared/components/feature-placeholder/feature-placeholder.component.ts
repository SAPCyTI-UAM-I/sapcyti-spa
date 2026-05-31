import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-feature-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Card, Message],
  template: `
    <div class="flex min-h-[50vh] items-center justify-center p-4">
      <p-card [header]="titleKey | translate" [style]="{ width: '28rem' }">
        <p-message
          severity="info"
          [text]="messageKey | translate"
          icon="pi pi-info-circle"
          [style]="{ width: '100%', justifyContent: 'flex-start' }"
        />
      </p-card>
    </div>
  `,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey = this.route.snapshot.data['titleKey'] as string;
  readonly messageKey = this.route.snapshot.data['messageKey'] as string;
}
