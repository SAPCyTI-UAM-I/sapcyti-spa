import { Injectable, inject } from '@angular/core';

import { EnrollmentHistoryEntry, PageResponse } from '../../../models';
import {
  ENROLLED_STUDENTS_SEED,
  seedToCatalogItem,
} from '../../../shared/mocks/enrolled-students.mock-data';
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

  // Padrón compartido: el catálogo, el sondeo y la planeación describen a la misma gente.
  private students: StudentCatalogItem[] = ENROLLED_STUDENTS_SEED.map(seedToCatalogItem);

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
      // HU-56: opcional al editar. Si no viene, se conserva el valor guardado en vez de
      // borrarlo — el spread lo dejaría en undefined porque la clave sí está presente.
      admissionTerm: body.admissionTerm ?? current.admissionTerm,
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
