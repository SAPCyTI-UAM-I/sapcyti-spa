import { ProgramType } from '../../models';

export interface EnrolledStudentSeed {
  id: number;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  enrollmentId: string;
  programType: ProgramType;
  /** Term the student was admitted in (HU-56). */
  admissionTerm: string;
}

/**
 * Single source of truth for the mock roster of enrolled students. Lives in `shared/`
 * so the enrollment-survey store (who may answer) and the trimestral-planning store
 * (who ends up in a group) describe the same people — mirroring how the real backend
 * reads one `students` table. Same rationale as `UEA_CATALOG_SEED`.
 *
 * Names are split because HU-57 orders group suffixes by last names.
 */
export const ENROLLED_STUDENTS_SEED: EnrolledStudentSeed[] = [
  {
    id: 1,
    firstName: 'Ana',
    firstLastName: 'López',
    secondLastName: 'Ramírez',
    enrollmentId: '2024630001',
    programType: 'MAESTRIA',
    admissionTerm: '24O',
  },
  {
    id: 2,
    firstName: 'Bruno',
    firstLastName: 'Díaz',
    secondLastName: 'Soto',
    enrollmentId: '2024630002',
    programType: 'MAESTRIA',
    admissionTerm: '24O',
  },
  {
    id: 3,
    firstName: 'Carla',
    firstLastName: 'Núñez',
    secondLastName: 'Vega',
    enrollmentId: '2024630003',
    programType: 'DOCTORADO',
    admissionTerm: '23O',
  },
  {
    id: 4,
    firstName: 'Diego',
    firstLastName: 'Ruiz',
    secondLastName: 'Mena',
    enrollmentId: '2024630004',
    programType: 'MAESTRIA',
    admissionTerm: '25I',
  },
  {
    id: 5,
    firstName: 'Elena',
    firstLastName: 'Torres',
    secondLastName: 'Gil',
    enrollmentId: '2024630005',
    programType: 'DOCTORADO',
    admissionTerm: '23O',
  },
];

export function seedFullName(student: EnrolledStudentSeed): string {
  return `${student.firstName} ${student.firstLastName} ${student.secondLastName}`.trim();
}
