/** Builds the full ngx-translate key for a domain error entry. */
export function domainErrorI18nKey(scope: string, errorKey: string): string {
  return `${scope}.${errorKey}`;
}
