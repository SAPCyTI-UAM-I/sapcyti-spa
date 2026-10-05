import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EnrollmentHistoryEntry, StudentDetailResponse } from '../../../models';
import { STUDENT_PROFILE_REPOSITORY } from '../repositories/student-profile.repository';

@Injectable({ providedIn: 'root' })
export class StudentProfileService {
  private readonly repo = inject(STUDENT_PROFILE_REPOSITORY);

  getMyProfile(): Observable<StudentDetailResponse> {
    return this.repo.getMyProfile();
  }

  getMyEnrollmentHistory(): Observable<EnrollmentHistoryEntry[]> {
    return this.repo.getMyEnrollmentHistory();
  }
}
