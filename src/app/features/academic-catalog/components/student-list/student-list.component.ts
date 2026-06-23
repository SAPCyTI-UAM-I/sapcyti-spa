import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Paginator } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { finalize, Observable } from 'rxjs';

import { PageResponse, StudentCatalogItem, StudentProgramSummary } from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentProgramService } from '../../services/student-program.service';
import { StudentService } from '../../services/student.service';
import {
  CATALOG_PROGRAM_TYPE_FILTER_OPTIONS,
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
  parseProgramTypeFilter,
} from '../../utils/catalog-filter.options';
import { CatalogListBase } from '../catalog-list.base';

@Component({
  selector: 'app-student-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    Dialog,
    InputText,
    Select,
    Paginator,
  ],
  templateUrl: './student-list.component.html',
})
export class StudentListComponent extends CatalogListBase<StudentCatalogItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(StudentService);
  private readonly programService = inject(StudentProgramService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  protected override readonly filters = this.fb.group({
    search: [''],
    programType: [''],
    active: [''],
  });

  readonly programTypes = CATALOG_PROGRAM_TYPE_FILTER_OPTIONS;
  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;

  readonly programChooserVisible = signal(false);
  readonly programChooserStudentId = signal<number | null>(null);
  readonly programChooserPrograms = signal<StudentProgramSummary[]>([]);
  readonly openingProgram = signal(false);

  protected override fetchItems(): Observable<PageResponse<StudentCatalogItem>> {
    const filters = this.filters.getRawValue();
    return this.service.listStudents({
      page: this.page(),
      size: this.pageSize,
      search: filters.search.trim() || undefined,
      programType: parseProgramTypeFilter(filters.programType),
      active: parseActiveFilter(filters.active),
    });
  }

  openProgram(student: StudentCatalogItem): void {
    this.openingProgram.set(true);
    this.programService
      .listPrograms(student.id)
      .pipe(
        finalize(() => this.openingProgram.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (programs) => this.handleProgramsLoaded(student.id, programs),
        error: () => this.showNoProgramToast(),
      });
  }

  selectProgram(studentId: number, programId: number): void {
    this.programChooserVisible.set(false);
    void this.router.navigate(['/academic-catalog/students', studentId, 'programs', programId]);
  }

  private handleProgramsLoaded(studentId: number, programs: StudentProgramSummary[]): void {
    if (programs.length === 0) {
      this.showNoProgramToast();
      return;
    }
    if (programs.length === 1) {
      void this.router.navigate([
        '/academic-catalog/students',
        studentId,
        'programs',
        programs[0]!.id,
      ]);
      return;
    }
    this.programChooserStudentId.set(studentId);
    this.programChooserPrograms.set(programs);
    this.programChooserVisible.set(true);
  }

  private showNoProgramToast(): void {
    this.messages.add({
      severity: 'error',
      summary: this.translate.instant('ACADEMIC_CATALOG.STUDENT_PROGRAM.ERRORS.no_program'),
      life: 4000,
    });
  }
}
