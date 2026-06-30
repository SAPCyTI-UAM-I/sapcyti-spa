import { formatPersonName } from './person-name.util';

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
});
