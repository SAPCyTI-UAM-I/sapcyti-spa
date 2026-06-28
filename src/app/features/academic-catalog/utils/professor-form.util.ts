import { AbstractControl, Validators } from '@angular/forms';

import { ProfessorType, RegisterProfessorRequest, UpdateProfessorRequest } from '../../../models';
import { CatalogSelectOption } from './catalog-filter.options';

export const PROFESSOR_TYPE_OPTIONS: CatalogSelectOption<ProfessorType>[] = [
  { labelKey: 'ACADEMIC_CATALOG.PROFESSORS.TYPES.INTERNO', value: 'INTERNO' },
  { labelKey: 'ACADEMIC_CATALOG.PROFESSORS.TYPES.EXTERNO', value: 'EXTERNO' },
];

export function applyProfessorTypeEmployeeRules(
  professorType: ProfessorType,
  employeeControl: AbstractControl<string>,
): void {
  if (professorType === 'INTERNO') {
    employeeControl.enable({ emitEvent: false });
    employeeControl.setValidators([Validators.required, Validators.maxLength(20)]);
  } else {
    employeeControl.setValue('', { emitEvent: false });
    employeeControl.clearValidators();
    employeeControl.disable({ emitEvent: false });
    employeeControl.setErrors(null);
  }
  employeeControl.updateValueAndValidity({ emitEvent: false });
}

export function normalizeProfessorEmployeeNumber(
  professorType: ProfessorType,
  employeeNumber: string,
): string | null | undefined {
  if (professorType === 'EXTERNO') {
    return null;
  }
  const trimmed = employeeNumber.trim();
  return trimmed || undefined;
}

export function buildRegisterProfessorRequest(
  value: RegisterProfessorRequest & { graduateProgramId: number },
): RegisterProfessorRequest {
  const employeeNumber = normalizeProfessorEmployeeNumber(
    value.professorType,
    value.employeeNumber ?? '',
  );
  return {
    ...value,
    secondLastName: value.secondLastName?.trim() || undefined,
    phoneExtension: value.phoneExtension?.trim() || undefined,
    nextSabbaticalStart: value.nextSabbaticalStart || undefined,
    nextSabbaticalEnd: value.nextSabbaticalEnd || undefined,
    employeeNumber,
  };
}

export function buildUpdateProfessorRequest(value: UpdateProfessorRequest): UpdateProfessorRequest {
  const employeeNumber = normalizeProfessorEmployeeNumber(
    value.professorType,
    value.employeeNumber ?? '',
  );
  return {
    ...value,
    secondLastName: value.secondLastName?.trim() || undefined,
    phoneExtension: value.phoneExtension?.trim() || undefined,
    nextSabbaticalStart: value.nextSabbaticalStart || undefined,
    nextSabbaticalEnd: value.nextSabbaticalEnd || undefined,
    employeeNumber,
  };
}

export function sabbaticalDateOrderValidator(
  start: string | undefined,
  end: string | undefined,
): boolean {
  if (!start || !end) {
    return true;
  }
  return end >= start;
}
