import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
import { ExamOptionsDto, ExamRequirementsResponse, ExamType } from '../../../models';
import { ExamRequestMockStore } from '../mocks/exam-request-mock.store';
import { ExamRequestRepository } from './exam-request.repository';

@Injectable()
export class ExamRequestMockRepository implements ExamRequestRepository {
  private readonly store = inject(ExamRequestMockStore);

  getOptions(): Observable<ExamOptionsDto> {
    return fromMockStore(() => this.store.getOptions());
  }

  getRequirements(examType: ExamType): Observable<ExamRequirementsResponse> {
    return fromMockStore(() => this.store.getRequirements(examType));
  }
}
