import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { CreateSurveyRequest } from '../../../models';

/** Term format: two year digits + period letter, e.g. `26O`, `27I`, `27P`. */
export const TERM_PATTERN = /^\d{2}[OIP]$/i;

export interface SurveyFormValue {
  term: string;
  opensAt: Date | null;
  closesAt: Date | null;
  introMessage: string;
}

export type SurveyFormGroup = FormGroup<{
  term: FormControl<string>;
  opensAt: FormControl<Date | null>;
  closesAt: FormControl<Date | null>;
  introMessage: FormControl<string>;
}>;

/** Group validator: `closesAt` must be strictly after `opensAt`. */
export function closesAfterOpensValidator(group: AbstractControl): ValidationErrors | null {
  const opensAt = group.get('opensAt')?.value as Date | null;
  const closesAt = group.get('closesAt')?.value as Date | null;
  if (!opensAt || !closesAt) return null;
  return closesAt.getTime() > opensAt.getTime() ? null : { closesBeforeOpens: true };
}

export function buildSurveyFormGroup(fb: NonNullableFormBuilder): SurveyFormGroup {
  return fb.group(
    {
      term: fb.control('', [Validators.required, Validators.pattern(TERM_PATTERN)]),
      opensAt: fb.control<Date | null>(null, [Validators.required]),
      closesAt: fb.control<Date | null>(null, [Validators.required]),
      introMessage: fb.control('', [Validators.maxLength(500)]),
    },
    { validators: closesAfterOpensValidator },
  );
}

export function toCreateRequest(value: SurveyFormValue): CreateSurveyRequest {
  const introMessage = value.introMessage.trim();
  return {
    term: value.term.trim().toUpperCase(),
    opensAt: value.opensAt ? value.opensAt.toISOString() : '',
    closesAt: value.closesAt ? value.closesAt.toISOString() : '',
    introMessage: introMessage.length > 0 ? introMessage : null,
  };
}

/** Same shape as create; also used to reopen a CERRADO survey. */
export const toUpdateRequest = toCreateRequest;

const NEXT_PERIOD: Record<string, { period: string; bumpYear: boolean }> = {
  O: { period: 'I', bumpYear: true },
  I: { period: 'P', bumpYear: false },
  P: { period: 'O', bumpYear: false },
};

/**
 * Suggests the next term after the most recent one (e.g. `26O` → `27I` → `27P` → `27O`).
 * Returns null when there is no previous term. The suggestion only prefills the field.
 */
export function suggestNextTerm(latestTerm: string | null): string | null {
  if (!latestTerm) return null;
  const match = TERM_PATTERN.exec(latestTerm.trim());
  if (!match) return null;
  const year = Number(latestTerm.trim().slice(0, 2));
  const period = latestTerm.trim().charAt(2).toUpperCase();
  const next = NEXT_PERIOD[period];
  if (!next) return null;
  const nextYear = (year + (next.bumpYear ? 1 : 0)) % 100;
  return `${String(nextYear).padStart(2, '0')}${next.period}`;
}
