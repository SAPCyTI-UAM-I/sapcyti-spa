import {
  createDomainErrorMapper,
  matchCode,
  matchSpringBootNotFound,
  matchStatus,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export type UeaError =
  | 'uea_already_exists'
  | 'file_format_invalid'
  | 'clave_invalid_format'
  | 'reference_not_found'
  | 'server';

export const mapUeaError = createDomainErrorMapper<UeaError>({
  rules: [
    { match: matchCode('UEA_ALREADY_EXISTS'), key: 'uea_already_exists' },
    { match: matchCode('FILE_FORMAT_INVALID'), key: 'file_format_invalid' },
    { match: matchCode('CLAVE_INVALID_FORMAT'), key: 'clave_invalid_format' },
    { match: matchSpringBootNotFound, key: 'reference_not_found' },
    { match: matchStatus(404), key: 'reference_not_found' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
