import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { ExamOptionsDto, ExamRequirementsResponse, ExamType } from '../../../models';

export interface ExamRequestRepository {
  getOptions(): Observable<ExamOptionsDto>;
  getRequirements(examType: ExamType): Observable<ExamRequirementsResponse>;
}

export const EXAM_REQUEST_REPOSITORY = new InjectionToken<ExamRequestRepository>(
  'ExamRequestRepository',
);
