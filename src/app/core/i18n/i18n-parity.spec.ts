import { describe, it, expect } from 'vitest';
import esJson from '../../../assets/i18n/es.json';
import enJson from '../../../assets/i18n/en.json';

const ALLOWED_LOWERCASE_KEYS = new Set([
  'AUTH.FORGOT_PASSWORD.EMAIL_PLACEHOLDER',
  'AUTH.LOGIN.EMAIL_PLACEHOLDER',
]);

const PARAM_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

describe('i18n Parity & Quality Tests', () => {
  const es = flattenKeys(esJson as Record<string, unknown>);
  const en = flattenKeys(enJson as Record<string, unknown>);

  const esKeys = Object.keys(es).sort();
  const enKeys = Object.keys(en).sort();
  const esKeySet = new Set(esKeys);
  const enKeySet = new Set(enKeys);

  it('should have the exact same set of translation keys in es.json and en.json', () => {
    const missingInEn = esKeys.filter((k) => !enKeySet.has(k));
    const missingInEs = enKeys.filter((k) => !esKeySet.has(k));

    expect(
      missingInEn,
      `Keys present in es.json but missing in en.json: ${missingInEn.join(', ')}`,
    ).toEqual([]);
    expect(
      missingInEs,
      `Keys present in en.json but missing in es.json: ${missingInEs.join(', ')}`,
    ).toEqual([]);
    expect(esKeys.length).toBe(enKeys.length);
  });

  it('should not contain any empty translation strings', () => {
    const emptyEs = esKeys.filter((k) => !es[k]?.trim());
    const emptyEn = enKeys.filter((k) => !en[k]?.trim());

    expect(emptyEs, `Empty values in es.json: ${emptyEs.join(', ')}`).toEqual([]);
    expect(emptyEn, `Empty values in en.json: ${emptyEn.join(', ')}`).toEqual([]);
  });

  it('should have matching interpolation parameters {{param}} between es.json and en.json', () => {
    const mismatches: string[] = [];

    for (const key of esKeys) {
      const valEs = es[key] ?? '';
      const valEn = en[key] ?? '';

      const paramsEs = Array.from(valEs.matchAll(PARAM_REGEX), (m) => m[1]).sort();
      const paramsEn = Array.from(valEn.matchAll(PARAM_REGEX), (m) => m[1]).sort();

      if (JSON.stringify(paramsEs) !== JSON.stringify(paramsEn)) {
        mismatches.push(
          `[${key}] ES expects [${paramsEs.join(', ')}] but EN expects [${paramsEn.join(', ')}]`,
        );
      }
    }

    expect(
      mismatches,
      `Interpolation parameter mismatches found: \n${mismatches.join('\n')}`,
    ).toEqual([]);
  });

  it('should enforce Sentence case (initial uppercase letter) on all user-facing strings', () => {
    const lowercaseErrors: string[] = [];

    for (const key of esKeys) {
      if (ALLOWED_LOWERCASE_KEYS.has(key)) {
        continue;
      }

      const valEs = (es[key] ?? '').trim();
      const valEn = (en[key] ?? '').trim();

      if (/^[a-zñáéíóú]/.test(valEs)) {
        lowercaseErrors.push(`[ES] "${key}": "${valEs}" starts with lowercase`);
      }

      if (/^[a-z]/.test(valEn)) {
        lowercaseErrors.push(`[EN] "${key}": "${valEn}" starts with lowercase`);
      }
    }

    expect(
      lowercaseErrors,
      `User-facing strings must use Sentence case (initial uppercase):\n${lowercaseErrors.join('\n')}`,
    ).toEqual([]);
  });
});
