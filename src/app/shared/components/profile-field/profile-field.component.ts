import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Single label → value row used inside profile-style definition lists.
 * The host renders with `display: contents` so it participates directly in the
 * parent grid/`<dl>` layout without introducing an extra box.
 */
@Component({
  selector: 'app-profile-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    <div
      class="gap-md py-sm border-outline flex items-baseline justify-between border-b last:border-b-0"
    >
      <dt class="text-caption text-text-secondary shrink-0">{{ label() }}</dt>
      <dd class="text-body-md text-right font-medium">
        <ng-content />
      </dd>
    </div>
  `,
})
export class ProfileFieldComponent {
  readonly label = input.required<string>();
}
