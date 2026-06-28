import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import { isAreaInLine } from '../../../models';

export interface ProgramCatalogFields {
  lineOfKnowledge?: string;
  researchArea?: string;
  advisorIds?: number[];
}

export function validateProgramCatalogFields(fields: ProgramCatalogFields): string | null {
  const advisorIds = fields.advisorIds ?? [];
  if (new Set(advisorIds).size !== advisorIds.length) {
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

    if (new Set(advisorIds).size !== advisorIds.length) {
      return { DUPLICATE_ADVISOR_IDS: true };
    }

    return null;
  };
}
