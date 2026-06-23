import { ParsedApiError } from '../models/parsed-api-error.model';
import { isSecurityError } from './classify-security-error.util';
import { toParsedApiError } from './parse-api-error.util';

export interface ErrorMappingRule<TKey extends string> {
  match: (api: ParsedApiError) => boolean;
  key: TKey;
}

export interface DomainErrorMapperConfig<TKey extends string> {
  rules: ErrorMappingRule<TKey>[];
  fallback: TKey;
  /** Returned for 401/403 instead of exposing security details. */
  securityFallback?: TKey;
}

export function createDomainErrorMapper<TKey extends string>(
  config: DomainErrorMapperConfig<TKey>,
): (error: unknown) => TKey {
  return (error: unknown): TKey => {
    if (isSecurityError(error)) {
      return config.securityFallback ?? config.fallback;
    }

    const api = toParsedApiError(error);
    if (!api) {
      return config.fallback;
    }

    for (const rule of config.rules) {
      if (rule.match(api)) {
        return rule.key;
      }
    }

    return config.fallback;
  };
}

export const matchCode =
  (code: string) =>
  (api: ParsedApiError): boolean =>
    api.code === code;

export const matchMessage =
  (message: string) =>
  (api: ParsedApiError): boolean =>
    api.message === message;

export const matchStatus =
  (status: number) =>
  (api: ParsedApiError): boolean =>
    api.status === status;

export const matchConflict =
  (message: string) =>
  (api: ParsedApiError): boolean =>
    api.code === 'CONFLICT' && api.message === message;

export const matchNotFound =
  (message: string) =>
  (api: ParsedApiError): boolean =>
    api.status === 404 && api.message === message;

export const matchValidation =
  (message: string) =>
  (api: ParsedApiError): boolean =>
    api.message === message &&
    (api.code === 'VALIDATION_ERROR' || api.status === 400 || api.code === undefined);
