import { formatPersonName, formatProfessorName } from './person-name.util';

describe('person-name.util', () => {
  describe('formatPersonName', () => {
    it('joins first name, first last name and second last name', () => {
      expect(
        formatPersonName({
          firstName: 'Ana',
          firstLastName: 'García',
          secondLastName: 'López',
        }),
      ).toBe('Ana García López');
    });

    it('omits empty optional parts', () => {
      expect(
        formatPersonName({
          firstName: 'Ana',
          firstLastName: 'García',
          secondLastName: '',
        }),
      ).toBe('Ana García');
    });

    it('supports last-first order', () => {
      expect(
        formatPersonName(
          {
            firstName: 'Ana',
            firstLastName: 'García',
            secondLastName: 'López',
          },
          'last-first',
        ),
      ).toBe('García López Ana');
    });
  });

  describe('formatProfessorName', () => {
    it('formats professor name in last-first order', () => {
      expect(
        formatProfessorName({
          firstName: 'Carlos',
          firstLastName: 'Pérez',
          secondLastName: 'Mora',
        }),
      ).toBe('Pérez Mora Carlos');
    });

    it('returns empty string when professor is null or undefined', () => {
      expect(formatProfessorName(null)).toBe('');
      expect(formatProfessorName(undefined)).toBe('');
    });
  });
});
