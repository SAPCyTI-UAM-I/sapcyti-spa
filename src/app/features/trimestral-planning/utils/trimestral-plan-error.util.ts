import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  createDomainErrorMapper,
  matchCode,
  matchNotFound,
  matchStatus,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const TRIMESTRAL_PLAN_ERROR_I18N_SCOPE = 'TRIMESTRAL_PLANNING.ERRORS' as const;

export type TrimestralPlanError =
  | 'already_exists'
  | 'annual_plan_required'
  | 'annual_plan_not_terminated'
  | 'survey_not_closed'
  | 'survey_not_found'
  | 'not_editable'
  | 'invalid_transition'
  | 'professor_unavailable'
  | 'student_unavailable'
  | 'not_found'
  | 'validation'
  | 'server';

export const mapTrimestralPlanError = createDomainErrorMapper<TrimestralPlanError>({
  rules: [
    { match: matchCode('TRIMESTRAL_PLAN_ALREADY_EXISTS'), key: 'already_exists' },
    { match: matchCode('ANNUAL_PLAN_REQUIRED'), key: 'annual_plan_required' },
    {
      match: matchCode('ANNUAL_PLAN_NOT_TERMINATED'),
      key: 'annual_plan_not_terminated',
    },
    { match: matchCode('SURVEY_NOT_CLOSED'), key: 'survey_not_closed' },
    { match: matchCode('SURVEY_NOT_FOUND'), key: 'survey_not_found' },
    { match: matchCode('TRIMESTRAL_PLAN_NOT_EDITABLE'), key: 'not_editable' },
    { match: matchCode('INVALID_STATUS_TRANSITION'), key: 'invalid_transition' },
    /*
     * Guardar con un profesor o un alumno dado de baja también devuelve 404, y el genérico
     * decía «no se encontró la planeación», que es falso y manda a buscar donde no es.
     * Van antes que `matchStatus(404)`, que se queda para el plan inexistente.
     */
    {
      match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.PROFESSOR_NOT_FOUND),
      key: 'professor_unavailable',
    },
    {
      match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.STUDENT_NOT_FOUND),
      key: 'student_unavailable',
    },
    { match: matchStatus(404), key: 'not_found' },
    { match: matchStatus(400), key: 'validation' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
