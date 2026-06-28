import { BACKEND_MESSAGES } from '../constants/backend-messages';
import { mockApiError } from '../testing/mock-api-error.util';
import { mapCatalogError } from '../../../features/academic-catalog/utils/catalog-error.util';
import { mapPasswordChangeError } from '../../../features/account/utils/password-change-error.util';
import { mapStudentProgramError } from '../../../features/academic-catalog/utils/student-program-error.util';

/** Every backend message we rely on for domain mapping must stay non-empty and unique enough to map. */
describe('BACKEND_MESSAGES contract', () => {
  const academicMessages = Object.values(BACKEND_MESSAGES.ACADEMIC);
  const identityMessages = Object.values(BACKEND_MESSAGES.IDENTITY);

  it('defines non-empty academic and identity messages', () => {
    for (const message of [...academicMessages, ...identityMessages]) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps academic validation messages unique', () => {
    const validationMessages = [
      BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER,
      BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED,
      BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS,
      BACKEND_MESSAGES.ACADEMIC.SABBATICAL_DATE_ORDER,
    ];
    expect(new Set(validationMessages).size).toBe(validationMessages.length);
  });

  it('maps each catalog conflict message to a specific domain key', () => {
    expect(
      mapCatalogError(
        mockApiError({
          status: 409,
          error: 'CONFLICT',
          message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_STUDENT_EMAIL,
        }),
      ),
    ).toBe('duplicate_email');
    expect(
      mapCatalogError(
        mockApiError({
          status: 409,
          error: 'CONFLICT',
          message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ENROLLMENT,
        }),
      ),
    ).toBe('duplicate_enrollment');
    expect(
      mapCatalogError(
        mockApiError({
          status: 409,
          error: 'CONFLICT',
          message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_EMPLOYEE,
        }),
      ),
    ).toBe('duplicate_employee');
  });

  it('maps each student-program validation message to a specific domain key', () => {
    for (const [message, expected] of [
      [BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER, 'date_order'],
      [BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED, 'withdrawal_reason_required'],
      [BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS, 'duplicate_advisor_ids'],
    ] as const) {
      expect(
        mapStudentProgramError(
          mockApiError({
            status: 400,
            error: 'VALIDATION_ERROR',
            message,
          }),
        ),
      ).toBe(expected);
    }
  });

  it('maps identity password messages', () => {
    expect(
      mapPasswordChangeError(
        mockApiError({
          status: 400,
          error: 'VALIDATION_ERROR',
          message: BACKEND_MESSAGES.IDENTITY.CURRENT_PASSWORD_INCORRECT,
        }),
      ),
    ).toBe('current_password');
  });
});
