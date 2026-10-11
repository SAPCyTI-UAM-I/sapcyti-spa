import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { ExamOptionsDto, ExamRequirementsResponse, ExamType } from '../../../models';
import { ExamRequestRepository } from './exam-request.repository';

/** Lecturas de alumno. El contexto EXAM_STUDENT_OPERATION se reserva para escrituras. */
@Injectable()
export class ExamRequestHttpRepository implements ExamRequestRepository {
  private readonly http = inject(HttpClient);

  getOptions(): Observable<ExamOptionsDto> {
    return this.http.get<ExamOptionsDto>(API_ENDPOINTS.examRequests.me.options, {
      withCredentials: true,
    });
  }

  getRequirements(examType: ExamType): Observable<ExamRequirementsResponse> {
    return this.http.get<ExamRequirementsResponse>(
      API_ENDPOINTS.examRequests.me.requirements(examType),
      { withCredentials: true },
    );
  }
}
