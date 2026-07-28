/** Annual and trimestral quotas accept either `*` or a positive integer without leading zeroes. */
export const QUOTA_PATTERN = /^\*$|^[1-9][0-9]*$/;

export function isQuotaValue(value: string | null | undefined): boolean {
  if (value == null || value.trim() === '') {
    return true;
  }
  return QUOTA_PATTERN.test(value.trim());
}
