import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
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
import { EnrollmentSurveyMockStore } from '../mocks/enrollment-survey-mock.store';
import { EnrollmentSurveyRepository, UeaDemandSort } from './enrollment-survey.repository';

@Injectable()
export class EnrollmentSurveyMockRepository implements EnrollmentSurveyRepository {
  private readonly store = inject(EnrollmentSurveyMockStore);

  listSurveys(): Observable<SurveyResponse[]> {
    return of(this.store.listSurveys());
  }

  getSurvey(id: number): Observable<SurveyResponse> {
    return fromMockStore(() => this.store.getSurvey(id));
  }

  createSurvey(request: CreateSurveyRequest): Observable<SurveyResponse> {
    return fromMockStore(() => this.store.createSurvey(request));
  }

  updateSurvey(id: number, request: UpdateSurveyRequest): Observable<SurveyResponse> {
    return fromMockStore(() => this.store.updateSurvey(id, request));
  }

  closeSurvey(id: number): Observable<SurveyResponse> {
    return fromMockStore(() => this.store.closeSurvey(id));
  }

  deleteSurvey(id: number): Observable<void> {
    return fromMockStore(() => this.store.deleteSurvey(id));
  }

  getActiveSurvey(): Observable<StudentSurveyForm | null> {
    return of(this.store.getActiveSurvey());
  }

  submitResponse(id: number, request: SubmitResponseRequest): Observable<SubmittedResponse> {
    return fromMockStore(() => this.store.submitResponse(id, request));
  }

  getMyResponse(id: number): Observable<SubmittedResponse> {
    return fromMockStore(() => this.store.getMyResponse(id));
  }

  getResultsSummary(id: number): Observable<SurveyResultsSummary> {
    return fromMockStore(() => this.store.getResultsSummary(id));
  }

  getResultsUeas(id: number, sort?: UeaDemandSort): Observable<UeaDemandRow[]> {
    return fromMockStore(() => this.store.getResultsUeas(id, sort));
  }

  getResultsUeaStudents(id: number, ueaId: number): Observable<InterestedStudent[]> {
    return fromMockStore(() => this.store.getResultsUeaStudents(id, ueaId));
  }
}
