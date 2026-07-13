import { TestBed } from '@angular/core/testing';
import { NonNullableFormBuilder } from '@angular/forms';

import {
  buildSurveyFormGroup,
  suggestNextTerm,
  toCreateRequest,
} from './enrollment-survey-form.util';

describe('enrollment-survey-form.util', () => {
  let fb: NonNullableFormBuilder;

  beforeEach(() => {
    fb = TestBed.inject(NonNullableFormBuilder);
  });

  it('requires term/opensAt/closesAt', () => {
    const form = buildSurveyFormGroup(fb);
    expect(form.valid).toBe(false);
    expect(form.controls.term.hasError('required')).toBe(true);
  });

  it('rejects a malformed term', () => {
    const form = buildSurveyFormGroup(fb);
    form.controls.term.setValue('2026');
    expect(form.controls.term.hasError('pattern')).toBe(true);
  });

  it('flags closesAt before opensAt at the group level', () => {
    const form = buildSurveyFormGroup(fb);
    form.patchValue({ term: '26O', opensAt: '2026-10-05T10:00', closesAt: '2026-10-01T10:00' });
    expect(form.hasError('closesBeforeOpens')).toBe(true);
  });

  it('accepts closesAt after opensAt', () => {
    const form = buildSurveyFormGroup(fb);
    form.patchValue({ term: '26O', opensAt: '2026-10-01T10:00', closesAt: '2026-10-05T10:00' });
    expect(form.hasError('closesBeforeOpens')).toBe(false);
    expect(form.valid).toBe(true);
  });

  it('builds a request with ISO dates and null empty message', () => {
    const request = toCreateRequest({
      term: '26o',
      opensAt: '2026-10-01T10:00',
      closesAt: '2026-10-05T10:00',
      introMessage: '   ',
    });
    expect(request.term).toBe('26O');
    expect(request.opensAt).toBe(new Date('2026-10-01T10:00').toISOString());
    expect(request.introMessage).toBeNull();
  });

  it('suggests the next term with the year rotation O→I→P', () => {
    expect(suggestNextTerm('26O')).toBe('27I');
    expect(suggestNextTerm('27I')).toBe('27P');
    expect(suggestNextTerm('27P')).toBe('27O');
    expect(suggestNextTerm(null)).toBeNull();
    expect(suggestNextTerm('bad')).toBeNull();
  });
});
