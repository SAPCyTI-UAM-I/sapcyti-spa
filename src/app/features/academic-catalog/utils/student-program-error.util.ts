import { getApiErrorMessage, getHttpStatus } from '../../../core/http/utils/parse-api-error.util';

export type StudentProgramError =
  | 'program_not_found'
  | 'professor_not_found'
  | 'validation'
  | 'server';

export function mapStudentProgramError(error: unknown): StudentProgramError {
  const message = getApiErrorMessage(error);

  if (message === 'Student program not found') {
    return 'program_not_found';
  }

  if (message === 'Professor not found') {
    return 'professor_not_found';
  }

  if (getHttpStatus(error) === 400) {
    return 'validation';
  }

  return 'server';
}
