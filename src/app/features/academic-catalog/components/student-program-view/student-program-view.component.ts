import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs';

import { StudentProgramResponse } from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentProgramService } from '../../services/student-program.service';
import { formatProfessorName } from '../../utils/professor-display.util';
import { programStatusSeverity } from '../../utils/program-status.util';
import {
  StudentProgramError,
  mapStudentProgramError,
} from '../../utils/student-program-error.util';

@Component({
  selector: 'app-student-program-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [RouterLink, TranslatePipe, Button, Message, Tag],
  templateUrl: './student-program-view.component.html',
})
export class StudentProgramViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(StudentProgramService);
  private readonly destroyRef = inject(DestroyRef);

  readonly studentId = Number(this.route.snapshot.paramMap.get('studentId'));
  readonly programId = Number(this.route.snapshot.paramMap.get('programId'));

  readonly loading = signal(true);
  readonly error = signal<StudentProgramError | null>(null);
  readonly program = signal<StudentProgramResponse | null>(null);

  readonly formatProfessorName = formatProfessorName;
  readonly programStatusSeverity = programStatusSeverity;

  constructor() {
    this.load();
  }

  backToCatalog(): void {
    void this.router.navigateByUrl('/academic-catalog/students');
  }

  editRoute(): string[] {
    return [
      '/academic-catalog/students',
      String(this.studentId),
      'programs',
      String(this.programId),
      'edit',
    ];
  }

  private load(): void {
    if (!Number.isInteger(this.studentId) || !Number.isInteger(this.programId)) {
      this.loading.set(false);
      this.error.set('program_not_found');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service
      .getProgram(this.studentId, this.programId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (program) => this.program.set(program),
        error: (err) => this.error.set(mapStudentProgramError(err)),
      });
  }
}
