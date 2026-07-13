import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateSurveyRequest,
  InterestedStudent,
  StudentSurveyForm,
  SubmitResponseRequest,
  SubmittedResponse,
  SurveyResponse,
  SurveyResultsSummary,
  UeaDemandRow,
  UpdateSurveyRequest,
} from '../../../models';
import {
  ENROLLMENT_SURVEY_REPOSITORY,
  UeaDemandSort,
} from '../repositories/enrollment-survey.repository';

@Injectable({ providedIn: 'root' })
export class EnrollmentSurveyService {
  private readonly repository = inject(ENROLLMENT_SURVEY_REPOSITORY);

  listSurveys(): Observable<SurveyResponse[]> {
    return this.repository.listSurveys();
  }

  getSurvey(id: number): Observable<SurveyResponse> {
    return this.repository.getSurvey(id);
  }

  createSurvey(request: CreateSurveyRequest): Observable<SurveyResponse> {
    return this.repository.createSurvey(request);
  }

  updateSurvey(id: number, request: UpdateSurveyRequest): Observable<SurveyResponse> {
    return this.repository.updateSurvey(id, request);
  }

  closeSurvey(id: number): Observable<SurveyResponse> {
    return this.repository.closeSurvey(id);
  }

  deleteSurvey(id: number): Observable<void> {
    return this.repository.deleteSurvey(id);
  }

  getActiveSurvey(): Observable<StudentSurveyForm | null> {
    return this.repository.getActiveSurvey();
  }

  submitResponse(id: number, request: SubmitResponseRequest): Observable<SubmittedResponse> {
    return this.repository.submitResponse(id, request);
  }

  getMyResponse(id: number): Observable<SubmittedResponse> {
    return this.repository.getMyResponse(id);
  }

  getResultsSummary(id: number): Observable<SurveyResultsSummary> {
    return this.repository.getResultsSummary(id);
  }

  getResultsUeas(id: number, sort?: UeaDemandSort): Observable<UeaDemandRow[]> {
    return this.repository.getResultsUeas(id, sort);
  }

  getResultsUeaStudents(id: number, ueaId: number): Observable<InterestedStudent[]> {
    return this.repository.getResultsUeaStudents(id, ueaId);
  }
}
