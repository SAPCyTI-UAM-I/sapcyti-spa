import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';

/**
 * Standard loading / error / empty wrapper for list and table views. Projects
 * the loaded content via `<ng-content>` and only renders it once not loading,
 * not errored and not empty. Removes the repeated `@if (loading) … @else if`
 * spinner/retry/empty block from every list screen.
 */
@Component({
  selector: 'app-load-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, Button],
  template: `
    @if (loading()) {
      <div class="p-xl text-text-secondary text-center">
        <i class="pi pi-spin pi-spinner mr-sm"></i>{{ 'COMMON.STATES.LOADING' | translate }}
      </div>
    } @else if (error()) {
      <div class="p-xl gap-md flex flex-col items-center">
        <p class="text-error">{{ errorMessage() | translate }}</p>
        <p-button [label]="'COMMON.ACTIONS.RETRY' | translate" (onClick)="retry.emit()" />
      </div>
    } @else if (empty()) {
      <div class="p-xl text-text-secondary text-center">{{ emptyMessage() | translate }}</div>
    } @else {
      <ng-content />
    }
  `,
})
export class LoadStateComponent {
  readonly loading = input(false);
  readonly error = input(false);
  readonly empty = input(false);
  /** i18n key shown in the empty state. */
  readonly emptyMessage = input.required<string>();
  /** i18n key shown in the error state. */
  readonly errorMessage = input('ACADEMIC_CATALOG.STATES.LOAD_ERROR');

  readonly retry = output<void>();
}
