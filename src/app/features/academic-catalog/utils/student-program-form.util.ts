import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  isAreaInLine,
  ProgramStatus,
  ProgramType,
  ResearchAreaCatalogItem,
  UpdateStudentProgramRequest,
  UpdateStudentRequest,
} from '../../../models';

export interface ProgramCatalogFields {
  lineOfKnowledge?: string;
  researchArea?: string;
  advisorIds?: number[];
}

/** True when `ids` contains at least one repeated value. */
export function hasDuplicateIds(ids: readonly number[]): boolean {
  return new Set(ids).size !== ids.length;
}

/** Raw value of the student edit form, consumed by the payload builders below. */
export interface StudentEditFormValue {
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  nationality: string;
  birthDate: string;
  phone: string;
  phoneExtension: string;
  undergraduateDegree: string;
  lastDegreeObtained: string;
  programType: ProgramType;
  admissionDate: string;
  active: boolean;
  graduationDate: string;
  status: ProgramStatus;
  withdrawalReason: string;
  lineOfKnowledge: string;
  researchArea: string;
  tutorId: number | null;
  advisorIds: number[];
}

/** Builds the student-level update payload (HU-18). */
export function buildUpdateStudentRequest(value: StudentEditFormValue): UpdateStudentRequest {
  return {
    firstName: value.firstName.trim(),
    firstLastName: value.firstLastName.trim(),
    secondLastName: value.secondLastName.trim() || undefined,
    email: value.email.trim(),
    nationality: value.nationality.trim(),
    birthDate: value.birthDate,
    phone: value.phone.trim(),
    phoneExtension: value.phoneExtension.trim() || undefined,
    undergraduateDegree: value.undergraduateDegree.trim(),
    lastDegreeObtained: value.lastDegreeObtained.trim(),
    programType: value.programType,
    admissionDate: value.admissionDate,
    active: value.active,
  };
}

/** Builds the program-level update payload (HU-19/HU-20). */
export function buildUpdateStudentProgramRequest(
  value: StudentEditFormValue,
): UpdateStudentProgramRequest {
  return {
    admissionDate: value.admissionDate,
    graduationDate: value.graduationDate.trim() || undefined,
    lineOfKnowledge: value.lineOfKnowledge || undefined,
    researchArea: value.researchArea || undefined,
    status: value.status,
    withdrawalReason:
      value.status === 'BAJA' ? value.withdrawalReason.trim() || undefined : undefined,
    tutorId: value.tutorId,
    advisorIds: value.advisorIds,
  };
}

/**
 * Drops a stored line/area selection that no longer exists in the catalog so
 * the form never patches an option the select can't render.
 */
export function reconcileProgramCatalogSelection(
  catalog: ResearchAreaCatalogItem[],
  line: string,
  area: string,
): { line: string; area: string } {
  if (line && !catalog.some((item) => item.line === line)) {
    return { line: '', area: '' };
  }
  if (line && area) {
    const lineItem = catalog.find((item) => item.line === line);
    if (!lineItem || !lineItem.areas.includes(area)) {
      return { line, area: '' };
    }
  }
  return { line, area };
}

export function validateProgramCatalogFields(fields: ProgramCatalogFields): string | null {
  const advisorIds = fields.advisorIds ?? [];
  if (hasDuplicateIds(advisorIds)) {
    return BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS;
  }

  if (fields.lineOfKnowledge || fields.researchArea) {
    if (fields.lineOfKnowledge && fields.researchArea) {
      if (!isAreaInLine(fields.lineOfKnowledge, fields.researchArea)) {
        return 'Research area does not belong to the selected line of knowledge';
      }
    } else if (fields.researchArea && !fields.lineOfKnowledge) {
      return 'Line of knowledge is required when research area is selected';
    }
  }

  return null;
}

export function withdrawalReasonWhenBajaValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const status = group.get('status')?.value as string | undefined;
    const withdrawalReason = group.get('withdrawalReason')?.value as string | undefined;

    if (status === 'BAJA' && !withdrawalReason?.trim()) {
      return { WITHDRAWAL_REASON_REQUIRED: true };
    }

    return null;
  };
}

export function graduationDateAfterAdmissionValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const admissionDate = group.get('admissionDate')?.value as string | undefined;
    const graduationDate = group.get('graduationDate')?.value as string | undefined;

    if (admissionDate && graduationDate && graduationDate < admissionDate) {
      return { GRADUATION_BEFORE_ADMISSION: true };
    }

    return null;
  };
}

export function uniqueAdvisorIdsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const advisorIds = control.value as number[] | null | undefined;
    if (!advisorIds) {
      return null;
    }

    if (hasDuplicateIds(advisorIds)) {
      return { DUPLICATE_ADVISOR_IDS: true };
    }

    return null;
  };
}
