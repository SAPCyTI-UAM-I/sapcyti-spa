import { endOptions, startOptions, TIME_SLOTS } from './time-slot.util';

describe('time-slot.util', () => {
  it('covers 07:00 to 22:00 every half hour, zero padded', () => {
    expect(TIME_SLOTS).toHaveLength(31);
    expect(TIME_SLOTS[0]).toBe('07:00');
    expect(TIME_SLOTS[1]).toBe('07:30');
    expect(TIME_SLOTS.at(-1)).toBe('22:00');
    // El cero a la izquierda no es cosmético: el backend compara las horas como texto.
    expect(TIME_SLOTS.every((slot) => /^([01]\d|2[0-3]):[0-5]\d$/.test(slot))).toBe(true);
  });

  it('keeps a captured time that falls outside the grid, in its place', () => {
    const options = startOptions('09:47');

    expect(options).toContain('09:47');
    expect(options.indexOf('09:47')).toBe(options.indexOf('09:30') + 1);
  });

  it('does not duplicate a value already on the grid', () => {
    expect(startOptions('09:30').filter((slot) => slot === '09:30')).toHaveLength(1);
  });

  it('offers only times strictly after the start', () => {
    const options = endOptions('09:00', '');

    expect(options).not.toContain('09:00');
    expect(options).not.toContain('08:30');
    expect(options[0]).toBe('09:30');
  });

  it('pins an end that is no longer valid so it is not silently dropped', () => {
    // El validador marca el error; el select no debe borrar el dato por su cuenta.
    expect(endOptions('14:00', '10:00')).toContain('10:00');
  });

  it('offers the whole grid while the start is empty', () => {
    expect(endOptions('', '')).toEqual([...TIME_SLOTS]);
  });

  it('returns the same array instance for repeated calls', () => {
    expect(endOptions('11:00', '')).toBe(endOptions('11:00', ''));
  });
});
