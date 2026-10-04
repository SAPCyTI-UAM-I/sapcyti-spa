import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { EnrollmentHistoryEntry, StudentDetailResponse } from '../../../models';
import { StudentProfileRepository } from './student-profile.repository';

@Injectable()
export class StudentProfileHttpRepository implements StudentProfileRepository {
  private readonly http = inject(HttpClient);

  getMyProfile(): Observable<StudentDetailResponse> {
    return this.http.get<StudentDetailResponse>(API_ENDPOINTS.studentsMe, {
      withCredentials: true,
    });
  }

  getMyEnrollmentHistory(): Observable<EnrollmentHistoryEntry[]> {
    return this.http.get<EnrollmentHistoryEntry[]>(API_ENDPOINTS.studentEnrollmentHistoryMe, {
      withCredentials: true,
    });
  }
}
