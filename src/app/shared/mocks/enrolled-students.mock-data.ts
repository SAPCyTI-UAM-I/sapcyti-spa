import { DegreeLevel, ProgramType, StudentCatalogItem } from '../../models';

/**
 * Padrón mock de alumnos. **Única fuente de verdad**: lo leen el catálogo académico
 * (alta/listado/detalle), el sondeo (quién puede responder) y la planeación trimestral
 * (quién queda en un grupo), igual que el backend real lee una sola tabla `students`.
 * Mismo criterio que `UEA_CATALOG_SEED`.
 *
 * Los nombres van separados porque HU-57 ordena los sufijos de grupo por apellidos.
 */
export interface EnrolledStudentSeed {
  id: number;
  userId: number;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  enrollmentId: string;
  email: string;
  birthDate: string;
  phone: string;
  phoneExtension?: string;
  nationality: string;
  undergraduateDegree: string;
  lastDegreeObtained: DegreeLevel;
  programType: ProgramType;
  admissionDate: string;
  /** Trimestre de ingreso (HU-56); null en el alumno histórico cargado antes del campo. */
  admissionTerm: string | null;
  active: boolean;
}

export const ENROLLED_STUDENTS_SEED: EnrolledStudentSeed[] = [
  {
    id: 1,
    userId: 101,
    firstName: 'Ana',
    firstLastName: 'López',
    secondLastName: 'Ramírez',
    enrollmentId: '2024630001',
    email: 'ana.lopez@uam.mx',
    birthDate: '1998-04-12',
    phone: '5512345678',
    phoneExtension: '101',
    nationality: 'Mexicana',
    undergraduateDegree: 'Computación',
    lastDegreeObtained: 'LICENCIATURA',
    programType: 'MAESTRIA',
    admissionDate: '2024-09-01',
    admissionTerm: '24O',
    active: true,
  },
  {
    id: 2,
    userId: 102,
    firstName: 'Bruno',
    firstLastName: 'Díaz',
    secondLastName: 'Soto',
    enrollmentId: '2024630002',
    email: 'bruno.diaz@uam.mx',
    birthDate: '1997-07-22',
    phone: '5587654321',
    nationality: 'Mexicana',
    undergraduateDegree: 'Matemáticas',
    lastDegreeObtained: 'LICENCIATURA',
    programType: 'MAESTRIA',
    admissionDate: '2024-09-01',
    admissionTerm: '24O',
    active: true,
  },
  {
    id: 3,
    userId: 103,
    firstName: 'Carla',
    firstLastName: 'Núñez',
    secondLastName: 'Vega',
    enrollmentId: '2024630003',
    email: 'carla.nunez@uam.mx',
    birthDate: '1996-03-08',
    phone: '5599887766',
    nationality: 'Mexicana',
    undergraduateDegree: 'Computación',
    lastDegreeObtained: 'MAESTRIA',
    programType: 'DOCTORADO',
    admissionDate: '2023-09-01',
    admissionTerm: '23O',
    active: true,
  },
  {
    id: 4,
    userId: 104,
    firstName: 'Diego',
    firstLastName: 'Ruiz',
    secondLastName: 'Mena',
    enrollmentId: '2024630004',
    email: 'diego.ruiz@uam.mx',
    birthDate: '1999-11-30',
    phone: '5511223344',
    nationality: 'Mexicana',
    undergraduateDegree: 'Electrónica',
    lastDegreeObtained: 'LICENCIATURA',
    programType: 'MAESTRIA',
    admissionDate: '2025-01-06',
    admissionTerm: '25I',
    active: true,
  },
  {
    id: 5,
    userId: 105,
    firstName: 'Elena',
    firstLastName: 'Torres',
    secondLastName: 'Gil',
    enrollmentId: '2024630005',
    email: 'elena.torres@uam.mx',
    birthDate: '1995-06-17',
    phone: '5544556677',
    nationality: 'Mexicana',
    undergraduateDegree: 'Física',
    lastDegreeObtained: 'MAESTRIA',
    programType: 'DOCTORADO',
    admissionDate: '2023-09-01',
    admissionTerm: '23O',
    // Dada de baja después de responder el sondeo 26I: alimenta STUDENT_INACTIVE (HU-58).
    active: false,
  },
  {
    id: 6,
    userId: 106,
    firstName: 'Fernando',
    firstLastName: 'Aguirre',
    secondLastName: 'Peña',
    enrollmentId: '2023630010',
    email: 'fernando.aguirre@uam.mx',
    birthDate: '1994-02-25',
    phone: '5566778899',
    nationality: 'Mexicana',
    undergraduateDegree: 'Computación',
    lastDegreeObtained: 'LICENCIATURA',
    programType: 'MAESTRIA',
    admissionDate: '2023-01-09',
    // Alumno cargado antes de existir el campo (HU-56): se consulta sin error.
    admissionTerm: null,
    active: true,
  },
];

export function seedFullName(student: EnrolledStudentSeed): string {
  return `${student.firstName} ${student.firstLastName} ${student.secondLastName}`.trim();
}

/** Proyección al DTO del catálogo; `graduateProgramId` es siempre el tenant del mock. */
export function seedToCatalogItem(student: EnrolledStudentSeed): StudentCatalogItem {
  return {
    id: student.id,
    userId: student.userId,
    active: student.active,
    enrollmentId: student.enrollmentId,
    email: student.email,
    graduateProgramId: 1,
    firstName: student.firstName,
    firstLastName: student.firstLastName,
    secondLastName: student.secondLastName,
    nationality: student.nationality,
    birthDate: student.birthDate,
    phone: student.phone,
    phoneExtension: student.phoneExtension,
    undergraduateDegree: student.undergraduateDegree,
    lastDegreeObtained: student.lastDegreeObtained,
    programType: student.programType,
    admissionDate: student.admissionDate,
    admissionTerm: student.admissionTerm,
  };
}
