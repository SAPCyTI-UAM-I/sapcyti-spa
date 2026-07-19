import { Injectable, inject } from '@angular/core';

import { EnrollmentHistoryEntry, PageResponse } from '../../../models';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
  UpdateStudentRequest,
} from '../../../models';
import {
  generatedPassword,
  mockConflict,
  mockNotFound,
  nextId,
  normalizeSearch,
  page,
} from './catalog-mock.util';
import { StudentProgramMockStore } from './student-program-mock.store';

@Injectable({ providedIn: 'root' })
export class StudentMockStore {
  private readonly programMockStore = inject(StudentProgramMockStore);

  private students: StudentCatalogItem[] = [
    {
      id: 1,
      userId: 101,
      enrollmentId: '223300456',
      email: 'ana.garcia@uam.mx',
      graduateProgramId: 1,
      firstName: 'Ana',
      firstLastName: 'García',
      secondLastName: 'López',
      nationality: 'Mexicana',
      birthDate: '1998-04-12',
      phone: '5512345678',
      phoneExtension: '101',
      undergraduateDegree: 'Computación',
      lastDegreeObtained: 'LICENCIATURA',
      programType: 'MAESTRIA',
      admissionDate: '2025-09-01',
      admissionTerm: '25O',
      active: true,
    },
    {
      id: 2,
      userId: 102,
      enrollmentId: '223300457',
      email: 'roberto.jimenez@uam.mx',
      graduateProgramId: 1,
      firstName: 'Roberto',
      firstLastName: 'Jiménez',
      nationality: 'Mexicana',
      birthDate: '1996-07-22',
      phone: '5587654321',
      undergraduateDegree: 'Matemáticas',
      lastDegreeObtained: 'LICENCIATURA',
      programType: 'DOCTORADO',
      admissionDate: '2024-09-01',
      admissionTerm: '24O',
      active: false,
    },
    {
      id: 3,
      userId: 103,
      enrollmentId: '223300458',
      email: 'maria.lopez@uam.mx',
      graduateProgramId: 1,
      firstName: 'María',
      firstLastName: 'López',
      secondLastName: 'Hernández',
      nationality: 'Mexicana',
      birthDate: '1997-03-08',
      phone: '5599887766',
      undergraduateDegree: 'Computación',
      lastDegreeObtained: 'MAESTRIA',
      programType: 'MAESTRIA',
      admissionDate: '2023-09-01',
      admissionTerm: '23O',
      active: true,
    },
  ];

  listStudents(query: StudentCatalogQuery): PageResponse<StudentCatalogItem> {
    const search = normalizeSearch(query.search ?? '');
    const filtered = this.students.filter((student) => {
      const matchesSearch =
        !search ||
        normalizeSearch(
          `${student.firstName} ${student.firstLastName} ${student.secondLastName ?? ''} ${student.email} ${student.enrollmentId}`,
        ).includes(search);
      return (
        matchesSearch &&
        (!query.programType || student.programType === query.programType) &&
        (query.active === undefined || student.active === query.active)
      );
    });
    return page(filtered, query.page, query.size);
  }

  getStudent(studentId: number): StudentCatalogItem {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      throw mockNotFound('STUDENT_NOT_FOUND');
    }
    return student;
  }

  /**
   * HU-61 — histórico por trimestre. `PENDING` (plan sin terminar) nunca expone letra,
   * profesor ni horario: el histórico jamás enseña asignaciones provisionales.
   * Sin historia devuelve `[]`, no un 404.
   */
  getEnrollmentHistory(studentId: number): EnrollmentHistoryEntry[] {
    this.getStudent(studentId);
    return structuredClone(ENROLLMENT_HISTORY_SEED[studentId] ?? []);
  }

  updateStudent(studentId: number, body: UpdateStudentRequest): StudentCatalogItem {
    const index = this.students.findIndex((s) => s.id === studentId);
    if (index < 0) {
      throw mockNotFound('STUDENT_NOT_FOUND');
    }

    if (
      this.students.some(
        (student) =>
          student.id !== studentId && student.email.toLowerCase() === body.email.toLowerCase(),
      )
    ) {
      throw mockConflict('EMAIL_ALREADY_EXISTS');
    }

    const current = this.students[index]!;
    const updated: StudentCatalogItem = {
      ...current,
      ...body,
      secondLastName: body.secondLastName?.trim() || undefined,
      phoneExtension: body.phoneExtension?.trim() || undefined,
    };

    this.students = [...this.students.slice(0, index), updated, ...this.students.slice(index + 1)];
    return updated;
  }

  createStudent(request: RegisterStudentRequest): RegisterStudentResponse {
    if (
      this.students.some((student) => student.email.toLowerCase() === request.email.toLowerCase())
    ) {
      throw mockConflict('EMAIL_ALREADY_EXISTS');
    }
    if (this.students.some((student) => student.enrollmentId === request.enrollmentId)) {
      throw mockConflict('ENROLLMENT_ALREADY_EXISTS');
    }
    if (request.graduateProgramId !== 1) {
      throw mockNotFound('GRADUATE_PROGRAM_NOT_FOUND');
    }

    const student: StudentCatalogItem = {
      ...request,
      id: nextId(this.students),
      userId: 100 + nextId(this.students),
      active: true,
    };
    this.students = [student, ...this.students];
    this.programMockStore.createProgramForStudent(student, request);
    return { ...student, generatedPassword: generatedPassword(student.userId) };
  }

  hasUser(userId: number): boolean {
    return this.students.some((student) => student.userId === userId);
  }
}

/**
 * Histórico sembrado por alumno (HU-61). Cubre los tres casos de la spec: trimestre
 * TERMINADO con letra/profesor/horario, trimestre PENDING sin asignaciones, y alumno
 * agregado a mano que no respondió la encuesta.
 */
const ENROLLMENT_HISTORY_SEED: Record<number, EnrollmentHistoryEntry[]> = {
  1: [
    {
      term: '26I',
      academicTermSelected: 'III',
      mode: 'ENROLL_UEAS',
      planStatus: 'PENDING',
      note: 'PENDING',
      ueas: [
        {
          clave: '2156024',
          nombre: 'REDES Y PROTOCOLOS DE COMUNICACIONES',
          grupo: null,
          professorName: null,
          schedule: null,
        },
      ],
    },
    {
      term: '25P',
      academicTermSelected: 'II',
      mode: 'ENROLL_UEAS',
      planStatus: 'TERMINADA',
      note: null,
      ueas: [
        {
          clave: '2156027',
          nombre: 'INTELIGENCIA ARTIFICIAL',
          grupo: 'CP43',
          professorName: 'Rafaela Blanco',
          schedule: [
            { day: 'LUN', start: '08:30', end: '10:00', lab: false },
            { day: 'MAR', start: null, end: null, lab: false },
            { day: 'MIE', start: '08:30', end: '10:00', lab: true },
            { day: 'JUE', start: null, end: null, lab: false },
            { day: 'VIE', start: null, end: null, lab: false },
          ],
        },
      ],
    },
  ],
  2: [
    {
      term: '25P',
      academicTermSelected: null,
      mode: null,
      planStatus: 'TERMINADA',
      note: 'MANUAL_NOT_SURVEYED',
      ueas: [
        {
          clave: '2156038',
          nombre: 'ALGORITMOS DISTRIBUIDOS',
          grupo: 'CO43',
          professorName: 'Humberto Cedillo',
          schedule: null,
        },
      ],
    },
  ],
  // El alumno 3 no tiene historia: el detalle muestra el estado vacío.
};
