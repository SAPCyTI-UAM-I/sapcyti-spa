import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { EnrollmentHistoryEntry, StudentDetailResponse } from '../../../models';

export interface StudentProfileRepository {
  getMyProfile(): Observable<StudentDetailResponse>;
  getMyEnrollmentHistory(): Observable<EnrollmentHistoryEntry[]>;
}

export const STUDENT_PROFILE_REPOSITORY = new InjectionToken<StudentProfileRepository>(
  'StudentProfileRepository',
);
