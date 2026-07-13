import { InjectionToken } from '@angular/core';
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

export type UeaDemandSort = 'totalResponses,asc' | 'totalResponses,desc';

export interface EnrollmentSurveyRepository {
  // HU-40 — coordinator
  listSurveys(): Observable<SurveyResponse[]>;
  getSurvey(id: number): Observable<SurveyResponse>;
  createSurvey(request: CreateSurveyRequest): Observable<SurveyResponse>;
  updateSurvey(id: number, request: UpdateSurveyRequest): Observable<SurveyResponse>;
  closeSurvey(id: number): Observable<SurveyResponse>;
  deleteSurvey(id: number): Observable<void>;
  /** Whether the UEA catalog has at least one active UEA — a survey without UEAs is pointless. */
  hasActiveUeas(): Observable<boolean>;

  // HU-41 — student. `getActiveSurvey` maps a 404 (no active survey) to `null`.
  getActiveSurvey(): Observable<StudentSurveyForm | null>;
  submitResponse(id: number, request: SubmitResponseRequest): Observable<SubmittedResponse>;
  getMyResponse(id: number): Observable<SubmittedResponse>;

  // HU-42 — coordinator results
  getResultsSummary(id: number): Observable<SurveyResultsSummary>;
  getResultsUeas(id: number, sort?: UeaDemandSort): Observable<UeaDemandRow[]>;
  getResultsUeaStudents(id: number, ueaId: number): Observable<InterestedStudent[]>;
}

export const ENROLLMENT_SURVEY_REPOSITORY = new InjectionToken<EnrollmentSurveyRepository>(
  'EnrollmentSurveyRepository',
);
