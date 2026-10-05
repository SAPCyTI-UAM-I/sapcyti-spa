/**
 * Stable English messages returned by sapcyti-api (ErrorResponse.message).
 * Keep in sync with Java *Exception.MESSAGE constants and IllegalArgumentException literals.
 */
export const BACKEND_MESSAGES = {
  ACADEMIC: {
    DUPLICATE_STUDENT_EMAIL: 'A user with this email already exists',
    DUPLICATE_ENROLLMENT: 'A student with this enrollment ID already exists',
    DUPLICATE_EMPLOYEE: 'A professor with this employee number already exists',
    GRADUATE_PROGRAM_NOT_FOUND: 'Graduate program not found',
    STUDENT_NOT_FOUND: 'Student not found',
    PROFESSOR_NOT_FOUND: 'Professor not found',
    STUDENT_PROGRAM_NOT_FOUND: 'Student program not found',
    GRADUATION_DATE_ORDER: 'Graduation date must be on or after admission date',
    WITHDRAWAL_REASON_REQUIRED: 'Withdrawal reason is required when status is BAJA',
    DUPLICATE_ADVISOR_IDS: 'Duplicate advisor IDs are not allowed',
    SABBATICAL_DATE_ORDER: 'Sabbatical end date must be on or after start date',
    PROFESSOR_ALREADY_INACTIVE: 'Professor is already inactive',
    PROFESSOR_HAS_ACTIVE_ASSIGNMENTS: 'Professor is tutor or advisor of an active student program',
    EMPLOYEE_REQUIRED_FOR_INTERNO: 'Employee number is required for internal professors',
  },
  IDENTITY: {
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
    USER_NOT_FOUND: 'User not found',
  },
} as const;
