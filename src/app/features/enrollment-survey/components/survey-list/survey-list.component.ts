import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { finalize } from 'rxjs';

import { SurveyResponse } from '../../../../models';
import {
  CatalogRowLinkDirective,
  CatalogTagComponent,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { statusTagSeverity } from '../../utils/enrollment-survey-status.util';

/** HU-40 — coordinator: list of quarterly surveys. */
@Component({
  selector: 'app-survey-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    Button,
    LoadStateComponent,
    CatalogTagComponent,
    CatalogRowLinkDirective,
  ],
  templateUrl: './survey-list.component.html',
})
export class SurveyListComponent implements OnInit {
  private readonly service = inject(EnrollmentSurveyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly surveys = signal<SurveyResponse[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly statusTagSeverity = statusTagSeverity;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .listSurveys()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (surveys) => this.surveys.set(surveys),
        error: () => this.loadError.set(true),
      });
  }
}
