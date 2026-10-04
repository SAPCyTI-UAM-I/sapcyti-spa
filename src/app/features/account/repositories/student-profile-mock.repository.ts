import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { EnrollmentHistoryEntry, StudentDetailResponse } from '../../../models';
import {
  ENROLLED_STUDENTS_SEED,
  seedToCatalogItem,
} from '../../../shared/mocks/enrolled-students.mock-data';
import { StudentProfileRepository } from './student-profile.repository';

@Injectable()
export class StudentProfileMockRepository implements StudentProfileRepository {
  getMyProfile(): Observable<StudentDetailResponse> {
    const seed = ENROLLED_STUDENTS_SEED[0]!;
    const catalogItem = seedToCatalogItem(seed);
    const mockProfile: StudentDetailResponse = {
      ...catalogItem,
      program: {
        id: 100,
        studentId: catalogItem.id,
        graduateProgramId: 1,
        enrollmentId: catalogItem.enrollmentId,
        programType: catalogItem.programType,
        admissionDate: catalogItem.admissionDate,
        status: 'EN_INVESTIGACION',
        researchArea: 'Supercómputo (cómputo de alto rendimiento)',
        lineOfKnowledge: 'Ciencias e Ingeniería de la Computación',
        advisorIds: [],
        advisors: [],
      },
    };
    return of(mockProfile);
  }

  getMyEnrollmentHistory(): Observable<EnrollmentHistoryEntry[]> {
    const mockHistory: EnrollmentHistoryEntry[] = [
      {
        term: '24-O',
        academicTermSelected: 'I',
        mode: 'ENROLL_UEAS',
        planStatus: 'TERMINADA',
        note: null,
        ueas: [
          {
            clave: '2111001',
            nombre: 'Seminario de Investigación I',
            status: 'ASSIGNED',
            grupo: 'CC01',
            professors: [
              {
                professorId: 10,
                employeeNumber: '9988',
                professorName: 'Dr. Alan Turing',
              },
            ],
            schedule: [
              {
                day: 'LUN',
                start: '10:00',
                end: '12:00',
                lab: false,
              },
            ],
          },
        ],
      },
    ];
    return of(mockHistory);
  }
}
