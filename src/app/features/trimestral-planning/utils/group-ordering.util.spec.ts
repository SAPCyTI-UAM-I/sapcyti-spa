import { claveHeaderPositions } from './group-ordering.util';

describe('claveHeaderPositions', () => {
  const claves = ['2156024', '2156047', '2156047', '2156047', '2156073'];

  it('marks the position where each UEA starts', () => {
    const positions = claveHeaderPositions([0, 1, 2, 3, 4], (index) => claves[index]!);

    expect([...positions]).toEqual([0, 1, 4]);
  });

  it('marks positions in the filtered list, not group indexes', () => {
    // Se ven solo los tres grupos de la UEA repetida: un único encabezado, en el 0.
    const positions = claveHeaderPositions([1, 2, 3], (index) => claves[index]!);

    expect([...positions]).toEqual([0]);
  });

  it('has nothing to mark on an empty list', () => {
    expect(claveHeaderPositions([], () => '')).toEqual(new Set());
  });
});
