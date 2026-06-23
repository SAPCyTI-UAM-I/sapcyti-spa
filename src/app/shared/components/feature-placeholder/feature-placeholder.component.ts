import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Message } from 'primeng/message';

import { readFeaturePlaceholderRouteData } from '../../utils/feature-placeholder-route.util';

@Component({
  selector: 'app-feature-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Message],
  template: `
    <div class="flex min-h-[50vh] w-full items-start justify-center">
      <section
        class="bg-surface border-outline p-lg md:p-xl gap-lg flex w-full max-w-3xl flex-col rounded-xl border"
      >
        <header class="gap-md flex min-w-0 items-start">
          <span
            class="bg-primary-container text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          >
            <i class="pi pi-folder-open text-[18px]" aria-hidden="true"></i>
          </span>

          <div class="min-w-0">
            <h1 class="text-headline-lg text-on-surface font-headline-lg break-words">
              {{ titleKey | translate }}
            </h1>
          </div>
        </header>

        <p-message
          severity="info"
          [text]="messageKey | translate"
          icon="pi pi-info-circle"
          styleClass="w-full justify-start"
        />
      </section>
    </div>
  `,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = readFeaturePlaceholderRouteData(this.route.snapshot.data);

  readonly titleKey = this.routeData.titleKey;
  readonly messageKey = this.routeData.messageKey;
}
