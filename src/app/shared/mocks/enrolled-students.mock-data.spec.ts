import {
  ENROLLED_STUDENTS_SEED,
  seedFullName,
  seedToCatalogItem,
} from './enrolled-students.mock-data';
import { TERM_PATTERN } from '../utils/term.util';

describe('ENROLLED_STUDENTS_SEED', () => {
  it('has unique ids, userIds and enrollment ids', () => {
    const ids = ENROLLED_STUDENTS_SEED.map((s) => s.id);
    const userIds = ENROLLED_STUDENTS_SEED.map((s) => s.userId);
    const enrollments = ENROLLED_STUDENTS_SEED.map((s) => s.enrollmentId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(userIds).size).toBe(userIds.length);
    expect(new Set(enrollments).size).toBe(enrollments.length);
  });

  it('keeps every admission term in the HU-56 format, or null for a historical student', () => {
    for (const student of ENROLLED_STUDENTS_SEED) {
      if (student.admissionTerm !== null) {
        expect(TERM_PATTERN.test(student.admissionTerm)).toBe(true);
      }
    }
    expect(ENROLLED_STUDENTS_SEED.some((s) => s.admissionTerm === null)).toBe(true);
  });

  it('covers the states the screens need: an inactive student and a historical one', () => {
    expect(ENROLLED_STUDENTS_SEED.some((s) => !s.active)).toBe(true);
    expect(ENROLLED_STUDENTS_SEED.some((s) => s.admissionTerm === null)).toBe(true);
  });

  it('projects to the catalog DTO without losing identity', () => {
    const seed = ENROLLED_STUDENTS_SEED[0]!;
    const item = seedToCatalogItem(seed);

    expect(item).toMatchObject({
      id: seed.id,
      enrollmentId: seed.enrollmentId,
      admissionTerm: seed.admissionTerm,
      active: seed.active,
    });
    expect(seedFullName(seed)).toBe('Ana López Ramírez');
  });
});
