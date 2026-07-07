import { Injector, inject, Injectable } from '@angular/core';

import { PageResponse } from '../../../models';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  ProfessorDetailResponse,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
  UpdateProfessorRequest,
} from '../../../models';
import {
  generatedPassword,
  mockBadRequest,
  mockConflict,
  mockNotFound,
  nextId,
  normalizeSearch,
  page,
} from './catalog-mock.util';
import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import { sabbaticalDateOrderValidator } from '../utils/professor-form.util';
import { StudentProgramMockStore } from './student-program-mock.store';

@Injectable({ providedIn: 'root' })
export class ProfessorMockStore {
  private readonly injector = inject(Injector);

  private professors: ProfessorCatalogItem[] = [
    {
      id: 10,
      userId: 201,
      professorType: 'INTERNO',
      employeeNumber: '30568',
      email: 'humberto.cervantes@uam.mx',
      graduateProgramId: 1,
      firstName: 'Humberto Gustavo',
      firstLastName: 'Cervantes',
      secondLastName: 'Maceda',
      phone: '5511122233',
      phoneExtension: '204',
      commissionMember: true,
      active: true,
    },
    {
      id: 11,
      userId: 202,
      professorType: 'INTERNO',
      employeeNumber: '30910',
      email: 'laura.martinez@uam.mx',
      graduateProgramId: 1,
      firstName: 'Laura',
      firstLastName: 'Martínez',
      phone: '5544455566',
      commissionMember: false,
      active: true,
    },
    {
      id: 12,
      userId: 203,
      professorType: 'EXTERNO',
      employeeNumber: null,
      email: 'externo.consultor@example.com',
      graduateProgramId: 1,
      firstName: 'Carlos',
      firstLastName: 'Externo',
      phone: '5599988877',
      commissionMember: false,
      active: true,
    },
    {
      id: 13,
      userId: 204,
      professorType: 'INTERNO',
      employeeNumber: '31001',
      email: 'inactivo.prof@uam.mx',
      graduateProgramId: 1,
      firstName: 'Pedro',
      firstLastName: 'Inactivo',
      phone: '5510101010',
      commissionMember: false,
      active: false,
    },
  ];

  listProfessors(query: ProfessorCatalogQuery): PageResponse<ProfessorCatalogItem> {
    const search = normalizeSearch(query.search ?? '');
    const filtered = this.professors.filter((professor) => {
      const searchTarget = normalizeSearch(
        `${professor.firstName} ${professor.firstLastName} ${professor.secondLastName ?? ''} ${professor.email} ${professor.employeeNumber ?? ''}`,
      );
      const matchesSearch = !search || searchTarget.includes(search);
      return matchesSearch && (query.active === undefined || professor.active === query.active);
    });
    return page(filtered, query.page, query.size);
  }

  getProfessor(professorId: number): ProfessorDetailResponse {
    const professor = this.findProfessor(professorId);
    if (!professor) {
      throw mockNotFound('PROFESSOR_NOT_FOUND');
    }
    return { ...professor };
  }

  createProfessor(request: RegisterProfessorRequest): RegisterProfessorResponse {
    this.validateRequest(request);

    if (
      this.professors.some(
        (professor) => professor.email.toLowerCase() === request.email.toLowerCase(),
      )
    ) {
      throw mockConflict('EMAIL_ALREADY_EXISTS');
    }

    const employeeNumber = this.normalizeEmployeeNumber(request);
    if (
      request.professorType === 'INTERNO' &&
      this.professors.some(
        (professor) =>
          professor.professorType === 'INTERNO' &&
          professor.employeeNumber === employeeNumber &&
          professor.active,
      )
    ) {
      throw mockConflict('EMPLOYEE_NUMBER_ALREADY_EXISTS');
    }

    if (request.graduateProgramId !== 1) {
      throw mockNotFound('GRADUATE_PROGRAM_NOT_FOUND');
    }

    const professor: ProfessorCatalogItem = {
      ...request,
      employeeNumber,
      id: nextId(this.professors),
      userId: 200 + nextId(this.professors),
      active: true,
    };
    this.professors = [professor, ...this.professors];
    return { ...professor, generatedPassword: generatedPassword(professor.userId) };
  }

  updateProfessor(professorId: number, request: UpdateProfessorRequest): ProfessorDetailResponse {
    const index = this.professors.findIndex((professor) => professor.id === professorId);
    if (index < 0) {
      throw mockNotFound('PROFESSOR_NOT_FOUND');
    }

    this.validateRequest(request);

    const current = this.professors[index]!;

    // HU-24: type change is one-way (EXTERNO → INTERNO only).
    if (current.professorType === 'INTERNO' && request.professorType === 'EXTERNO') {
      throw mockConflict('INVALID_TYPE_CHANGE');
    }

    if (
      this.professors.some(
        (professor) =>
          professor.id !== professorId &&
          professor.email.toLowerCase() === request.email.toLowerCase(),
      )
    ) {
      throw mockConflict('EMAIL_ALREADY_EXISTS');
    }

    const employeeNumber = this.normalizeEmployeeNumber(request);

    // HU-24: NEMP is immutable once assigned (same value or omitted is accepted).
    if (current.employeeNumber && employeeNumber && employeeNumber !== current.employeeNumber) {
      throw mockConflict('NEMP_IMMUTABLE');
    }
    if (
      request.professorType === 'INTERNO' &&
      this.professors.some(
        (professor) =>
          professor.id !== professorId &&
          professor.professorType === 'INTERNO' &&
          professor.employeeNumber === employeeNumber &&
          professor.active,
      )
    ) {
      throw mockConflict('EMPLOYEE_NUMBER_ALREADY_EXISTS');
    }

    const updated: ProfessorCatalogItem = {
      ...current,
      ...request,
      employeeNumber,
    };
    this.professors = [
      ...this.professors.slice(0, index),
      updated,
      ...this.professors.slice(index + 1),
    ];
    return { ...updated };
  }

  deactivateProfessor(professorId: number): ProfessorDetailResponse {
    const index = this.professors.findIndex((professor) => professor.id === professorId);
    if (index < 0) {
      throw mockNotFound('PROFESSOR_NOT_FOUND');
    }

    const current = this.professors[index]!;
    if (!current.active) {
      throw mockConflict('PROFESSOR_ALREADY_INACTIVE');
    }

    const programStore = this.injector.get(StudentProgramMockStore);
    if (programStore.hasActiveAssignment(professorId)) {
      throw mockConflict('PROFESSOR_HAS_ACTIVE_ASSIGNMENTS');
    }

    const updated: ProfessorCatalogItem = { ...current, active: false };
    this.professors = [
      ...this.professors.slice(0, index),
      updated,
      ...this.professors.slice(index + 1),
    ];
    return { ...updated };
  }

  restoreProfessor(professorId: number): ProfessorDetailResponse {
    const index = this.professors.findIndex((professor) => professor.id === professorId);
    if (index < 0) {
      throw mockNotFound('PROFESSOR_NOT_FOUND');
    }

    const current = this.professors[index]!;
    if (current.active) {
      throw mockConflict('PROFESSOR_ALREADY_ACTIVE');
    }

    // HU-54 edge: restoring an interno whose (immutable) NEMP is now held by an active interno.
    if (
      current.professorType === 'INTERNO' &&
      current.employeeNumber &&
      this.professors.some(
        (professor) =>
          professor.id !== professorId &&
          professor.professorType === 'INTERNO' &&
          professor.employeeNumber === current.employeeNumber &&
          professor.active,
      )
    ) {
      throw mockConflict('DUPLICATE_EMPLOYEE_NUMBER');
    }

    const updated: ProfessorCatalogItem = { ...current, active: true };
    this.professors = [
      ...this.professors.slice(0, index),
      updated,
      ...this.professors.slice(index + 1),
    ];
    return { ...updated };
  }

  hasUser(userId: number): boolean {
    return this.professors.some((professor) => professor.userId === userId);
  }

  findById(id: number): ProfessorCatalogItem | undefined {
    return this.findProfessor(id);
  }

  private findProfessor(professorId: number): ProfessorCatalogItem | undefined {
    return this.professors.find((professor) => professor.id === professorId);
  }

  private validateRequest(request: RegisterProfessorRequest | UpdateProfessorRequest): void {
    if (request.professorType === 'INTERNO' && !request.employeeNumber?.trim()) {
      throw mockBadRequest(BACKEND_MESSAGES.ACADEMIC.EMPLOYEE_REQUIRED_FOR_INTERNO);
    }
    if (request.professorType === 'EXTERNO' && request.employeeNumber?.trim()) {
      throw mockBadRequest('Employee number must not be provided for external professors');
    }
    if (!sabbaticalDateOrderValidator(request.nextSabbaticalStart, request.nextSabbaticalEnd)) {
      throw mockBadRequest(BACKEND_MESSAGES.ACADEMIC.SABBATICAL_DATE_ORDER);
    }
  }

  private normalizeEmployeeNumber(
    request: RegisterProfessorRequest | UpdateProfessorRequest,
  ): string | null | undefined {
    if (request.professorType === 'EXTERNO') {
      return null;
    }
    return request.employeeNumber?.trim() || undefined;
  }
}
