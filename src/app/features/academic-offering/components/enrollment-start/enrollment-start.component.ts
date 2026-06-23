import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { FileUpload, FileSelectEvent } from 'primeng/fileupload';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';

import type { I18nKey } from '../../../../core/i18n/i18n-keys.generated';
import { AcademicOfferingOption } from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
// DEMO DATA — remove this import (and use `[]`) to drop all example data.
import { SAMPLE_TERMS } from '../../mocks/academic-offering.sample-data';

/**
 * HU-06 — Inicio del proceso de inscripción y carga de horarios (cascarón).
 *
 * Two independent actions, as in the manual: "Aceptar" starts the enrollment
 * process for the selected term (the CSV is optional and does NOT gate it), and
 * "Cargar" reads the optional CSV (validating its extension). No data layer yet —
 * the start and CSV processing are stubbed (TODO).
 */
@Component({
  selector: 'app-enrollment-start',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [TranslatePipe, Button, FileUpload, Message, Select],
  templateUrl: './enrollment-start.component.html',
})
export class EnrollmentStartComponent {
  // TODO(HU-06): load available terms from the academic-offering service.
  readonly terms = signal<AcademicOfferingOption[]>(SAMPLE_TERMS);
  readonly selectedTerm = signal<string | null>(null);
  readonly started = signal(false);

  /** File chosen via "Elegir archivo", pending the "Cargar" action. */
  private readonly selectedFile = signal<File | null>(null);
  /** Name of the file once successfully loaded via "Cargar". */
  readonly loadedFileName = signal<string | null>(null);
  readonly csvErrorKey = signal<I18nKey | null>(null);

  onTermChange(term: string): void {
    this.selectedTerm.set(term);
    this.started.set(false);
  }

  /** "Aceptar": starts the process with or without a CSV (HU-06: CSV optional). */
  start(): void {
    if (this.selectedTerm() === null) {
      return;
    }
    // TODO(HU-06): flip the term to IN_ENROLLMENT in the backend.
    this.started.set(true);
  }

  onFileSelect(event: FileSelectEvent): void {
    this.selectedFile.set(event.files[0] ?? null);
    this.csvErrorKey.set(null);
    this.loadedFileName.set(null);
  }

  /** "Cargar": reads the optional CSV, validating its extension first. */
  uploadCsv(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.loadedFileName.set(null);
      this.csvErrorKey.set('ACADEMIC_OFFERING.ENROLLMENT_START.ERRORS.INVALID_FORMAT');
      return;
    }
    // TODO(HU-06): POST the CSV and validate/parse it via the ACL import.
    this.csvErrorKey.set(null);
    this.loadedFileName.set(file.name);
  }
}
