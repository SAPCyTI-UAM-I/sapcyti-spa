import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { EnrollmentHistoryEntry } from '../../../models';
import { CatalogTagComponent } from '../catalog-tag/catalog-tag.component';
import { LoadStateComponent } from '../load-state/load-state.component';

@Component({
  selector: 'app-student-enrollment-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, CatalogTagComponent, LoadStateComponent],
  templateUrl: './student-enrollment-history.component.html',
})
export class StudentEnrollmentHistoryComponent {
  readonly history = input<EnrollmentHistoryEntry[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);

  readonly retry = output<void>();
}
