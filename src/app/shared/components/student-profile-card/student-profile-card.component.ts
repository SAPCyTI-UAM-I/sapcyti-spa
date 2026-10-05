import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  getLineOfKnowledgeLabelKey,
  getResearchAreaLabelKey,
  StudentDetailResponse,
} from '../../../models';
import { CatalogTagComponent } from '../catalog-tag/catalog-tag.component';
import { CopyableTextComponent } from '../copyable-text/copyable-text.component';
import { programStatusSeverity, programTypeTagSeverity } from '../../utils/catalog-tag.util';
import { formatProfessorName } from '../../utils/person-name.util';

@Component({
  selector: 'app-student-profile-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, CatalogTagComponent, CopyableTextComponent],
  templateUrl: './student-profile-card.component.html',
})
export class StudentProfileCardComponent {
  readonly student = input.required<StudentDetailResponse>();

  readonly formatProfessorName = formatProfessorName;
  readonly getLineOfKnowledgeLabelKey = getLineOfKnowledgeLabelKey;
  readonly getResearchAreaLabelKey = getResearchAreaLabelKey;
  readonly programStatusSeverity = programStatusSeverity;
  readonly programTypeTagSeverity = programTypeTagSeverity;

  readonly initials = computed(() => {
    const current = this.student();
    if (!current) {
      return '';
    }
    const first = current.firstName?.trim().charAt(0) ?? '';
    const last = current.firstLastName?.trim().charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  });
}
