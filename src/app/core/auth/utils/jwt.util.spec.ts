import { decodeJwtPayload } from './jwt.util';

function encodeTestJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.test-signature`;
}

describe('decodeJwtPayload', () => {
  it('decodes the JWT payload segment', () => {
    const token = encodeTestJwt({ sub: '42', role: 'STUDENT', graduateProgramId: 1 });
    const claims = decodeJwtPayload<{ sub: string; role: string; graduateProgramId: number }>(
      token,
    );

    expect(claims.sub).toBe('42');
    expect(claims.role).toBe('STUDENT');
    expect(claims.graduateProgramId).toBe(1);
  });

  it('throws on invalid token format', () => {
    expect(() => decodeJwtPayload('not-a-jwt')).toThrow('Invalid JWT format');
  });
});
