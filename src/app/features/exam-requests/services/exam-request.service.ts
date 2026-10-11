import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ExamOptionsDto, ExamRequirementsResponse, ExamType } from '../../../models';
import { EXAM_REQUEST_REPOSITORY } from '../repositories/exam-request.repository';
import { ExamRequestError, mapExamRequestError } from '../utils/exam-request-error.util';

@Injectable({ providedIn: 'root' })
export class ExamRequestService {
  private readonly repository = inject(EXAM_REQUEST_REPOSITORY);

  getOptions(): Observable<ExamOptionsDto> {
    return this.repository.getOptions();
  }

  getRequirements(examType: ExamType = 'GRADO'): Observable<ExamRequirementsResponse> {
    return this.repository.getRequirements(examType);
  }

  mapError(error: unknown): ExamRequestError {
    return mapExamRequestError(error);
  }
}
