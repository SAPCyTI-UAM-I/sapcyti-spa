import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ProfessorCatalogItem, StudentProgramResponse } from '../../../models';
import { professorReferenceToOption, professorToOption } from '../utils/professor-display.util';
import { ProfessorService } from './professor.service';

export interface ProfessorOption {
  readonly label: string;
  readonly value: number;
}

/**
 * Per-component controller for the tutor/advisor professor picker, shared by the
 * student registration and edit forms (both in this feature). Provide it at the
 * component level (`providers: [ProfessorOptionsController]`) so each form owns
 * its own state. Options are deduped by id and sorted; the ones "pinned" (a
 * program's assigned tutor/advisors) and any already loaded are always kept so a
 * selected value never drops out of the list while filtering.
 */
@Injectable()
export class ProfessorOptionsController {
  private readonly professorService = inject(ProfessorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly options = signal<ProfessorOption[]>([]);
  readonly loading = signal(false);

  private pinned: ProfessorOption[] = [];
  private searchTimeout?: ReturnType<typeof setTimeout>;

  /** Pins a program's assigned tutor + advisors so they stay listed while filtering. */
  pinFromProgram(program: StudentProgramResponse): void {
    const pinned = new Map<number, ProfessorOption>();
    if (program.tutor) {
      pinned.set(program.tutor.id, professorReferenceToOption(program.tutor));
    }
    for (const advisor of program.advisors) {
      pinned.set(advisor.id, professorReferenceToOption(advisor));
    }
    this.pinned = [...pinned.values()];
    this.merge([]);
  }

  /** Debounced handler for `p-select (onFilter)`. */
  onFilter(term: string | null | undefined): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(term ?? ''), 300);
  }

  load(search = ''): void {
    this.loading.set(true);
    this.professorService
      .listProfessors({ page: 0, size: 30, active: true, search: search.trim() || undefined })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (page) => this.merge(page.content) });
  }

  labelFor(id: number | null | undefined): string {
    if (id == null) {
      return '';
    }
    return this.options().find((option) => option.value === id)?.label ?? '';
  }

  private merge(professors: ProfessorCatalogItem[]): void {
    const options = new Map<number, ProfessorOption>();
    for (const option of [...this.pinned, ...this.options()]) {
      options.set(option.value, option);
    }
    for (const professor of professors) {
      options.set(professor.id, professorToOption(professor));
    }
    this.options.set(
      [...options.values()].sort((left, right) => left.label.localeCompare(right.label, 'es')),
    );
  }
}
