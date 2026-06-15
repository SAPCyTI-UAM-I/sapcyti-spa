import { Injectable } from '@angular/core';

import { PageResponse } from '../../../models/page-response.model';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models/professor.model';
import {
  generatedPassword,
  mockConflict,
  mockNotFound,
  nextId,
  normalizeSearch,
  page,
} from './catalog-mock.util';

@Injectable({ providedIn: 'root' })
export class ProfessorMockStore {
  private professors: ProfessorCatalogItem[] = [
    {
      id: 10,
      userId: 201,
      employeeNumber: '30568',
      email: 'humberto.cervantes@uam.mx',
      graduateProgramId: 1,
      firstName: 'Humberto Gustavo',
      firstLastName: 'Cervantes',
      secondLastName: 'Maceda',
      active: true,
    },
    {
      id: 11,
      userId: 202,
      employeeNumber: '30910',
      email: 'laura.martinez@uam.mx',
      graduateProgramId: 1,
      firstName: 'Laura',
      firstLastName: 'Martínez',
      active: true,
    },
  ];

  listProfessors(query: ProfessorCatalogQuery): PageResponse<ProfessorCatalogItem> {
    const search = normalizeSearch(query.search ?? '');
    const filtered = this.professors.filter((professor) => {
      const matchesSearch =
        !search ||
        normalizeSearch(
          `${professor.firstName} ${professor.firstLastName} ${professor.secondLastName ?? ''} ${professor.email} ${professor.employeeNumber}`,
        ).includes(search);
      return matchesSearch && (query.active === undefined || professor.active === query.active);
    });
    return page(filtered, query.page, query.size);
  }

  createProfessor(request: RegisterProfessorRequest): RegisterProfessorResponse {
    if (
      this.professors.some(
        (professor) => professor.email.toLowerCase() === request.email.toLowerCase(),
      )
    ) {
      throw mockConflict('EMAIL_ALREADY_EXISTS');
    }
    if (this.professors.some((professor) => professor.employeeNumber === request.employeeNumber)) {
      throw mockConflict('EMPLOYEE_NUMBER_ALREADY_EXISTS');
    }
    if (request.graduateProgramId !== 1) {
      throw mockNotFound('GRADUATE_PROGRAM_NOT_FOUND');
    }

    const professor: ProfessorCatalogItem = {
      ...request,
      id: nextId(this.professors),
      userId: 200 + nextId(this.professors),
      active: true,
    };
    this.professors = [professor, ...this.professors];
    return { ...professor, generatedPassword: generatedPassword(professor.userId) };
  }

  hasUser(userId: number): boolean {
    return this.professors.some((professor) => professor.userId === userId);
  }
}
