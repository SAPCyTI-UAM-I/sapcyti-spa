import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';

import { passwordsMatchValidator } from './passwords-match.validator';
import { createPairedPasswordFormFeedback } from './paired-password-form-feedback';

describe('createPairedPasswordFormFeedback', () => {
  const fb = new FormBuilder().nonNullable;

  it('detects passwords mismatch while typing', () => {
    TestBed.runInInjectionContext(() => {
      const submitted = signal(false);
      const form = fb.group(
        {
          newPassword: [''],
          confirmPassword: [''],
        },
        { validators: passwordsMatchValidator() },
      );
      const feedback = createPairedPasswordFormFeedback(form, submitted);

      form.patchValue({ newPassword: 'ValidPass1!', confirmPassword: 'Different1!' });
      expect(feedback.passwordsMismatch()).toBe(true);

      form.patchValue({ confirmPassword: 'ValidPass1!' });
      expect(feedback.passwordsMismatch()).toBe(false);
    });
  });

  it('shows mismatch after submit when confirm is still empty', () => {
    TestBed.runInInjectionContext(() => {
      const submitted = signal(true);
      const form = fb.group(
        {
          newPassword: ['ValidPass1!'],
          confirmPassword: [''],
        },
        { validators: passwordsMatchValidator() },
      );
      const feedback = createPairedPasswordFormFeedback(form, submitted);

      expect(feedback.passwordsMismatch()).toBe(false);
    });
  });
});
