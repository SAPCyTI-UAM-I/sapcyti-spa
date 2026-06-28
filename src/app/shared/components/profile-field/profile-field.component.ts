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
      class="gap-x-md py-sm border-outline flex min-w-0 items-start justify-between border-b last:border-b-0"
    >
      <dt class="text-caption text-text-secondary min-w-0 pr-sm break-words">{{ label() }}</dt>
      <dd class="text-body-md min-w-0 flex-1 break-words text-right font-medium">
        <ng-content />
      </dd>
    </div>
  `,
})
export class ProfileFieldComponent {
  readonly label = input.required<string>();
}
