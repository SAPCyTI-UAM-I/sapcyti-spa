import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

/**
 * Standard back button for detail, edit, and sub-page headers.
 * Positioned to the left of the main title, featuring a prominent,
 * elevated circular design aligned with the SAPCyTI design system.
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0',
  },
  imports: [RouterLink, TranslatePipe, Button, Tooltip],
  template: `
    <p-button
      type="button"
      icon="pi pi-arrow-left"
      variant="outlined"
      severity="secondary"
      styleClass="!h-9 !w-9 !p-0 shrink-0 !rounded-lg shadow-xs hover:shadow-sm hover:-translate-x-0.5 hover:!border-primary hover:!bg-primary-container hover:!text-primary-hover active:scale-95 transition-all duration-150"
      [pTooltip]="tooltip() ?? ('COMMON.ACTIONS.BACK' | translate)"
      tooltipPosition="bottom"
      [ariaLabel]="ariaLabel() ?? ('COMMON.ACTIONS.BACK' | translate)"
      [routerLink]="routerLink() ?? null"
      (onClick)="handleClick()"
      data-testid="back-button"
    />
  `,
})
export class BackButtonComponent {
  readonly routerLink = input<string | readonly (string | number)[] | null>(null);
  readonly tooltip = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly back = output<void>();

  handleClick(): void {
    this.back.emit();
  }
}
