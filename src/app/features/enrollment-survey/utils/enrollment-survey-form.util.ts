import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { CreateSurveyRequest } from '../../../models';
import { TERM_PATTERN } from '../../../shared/utils/term.util';
import { combineToDate, combineToIso } from './datetime-fields.util';

export interface SurveyFormValue {
  term: string;
  opensDate: string;
  opensTime: string;
  closesDate: string;
  closesTime: string;
  introMessage: string;
}

export type SurveyFormGroup = FormGroup<{
  term: FormControl<string>;
  opensDate: FormControl<string>;
  opensTime: FormControl<string>;
  closesDate: FormControl<string>;
  closesTime: FormControl<string>;
  introMessage: FormControl<string>;
}>;

/** Group validator: the closing instant must be strictly after the opening instant. */
export function closesAfterOpensValidator(group: AbstractControl): ValidationErrors | null {
  const opens = combineToDate(group.get('opensDate')?.value, group.get('opensTime')?.value);
  const closes = combineToDate(group.get('closesDate')?.value, group.get('closesTime')?.value);
  if (!opens || !closes) return null;
  return closes.getTime() > opens.getTime() ? null : { closesBeforeOpens: true };
}

export function buildSurveyFormGroup(fb: NonNullableFormBuilder): SurveyFormGroup {
  return fb.group(
    {
      term: fb.control('', [Validators.required, Validators.pattern(TERM_PATTERN)]),
      opensDate: fb.control('', [Validators.required]),
      opensTime: fb.control('', [Validators.required]),
      closesDate: fb.control('', [Validators.required]),
      closesTime: fb.control('', [Validators.required]),
      introMessage: fb.control('', [Validators.maxLength(500)]),
    },
    { validators: closesAfterOpensValidator },
  );
}

export function toCreateRequest(value: SurveyFormValue): CreateSurveyRequest {
  const introMessage = value.introMessage.trim();
  return {
    term: value.term.trim().toUpperCase(),
    opensAt: combineToIso(value.opensDate, value.opensTime),
    closesAt: combineToIso(value.closesDate, value.closesTime),
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
