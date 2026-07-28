/**
 * Posiciones de la lista visible donde arranca una UEA distinta. Los grupos ya vienen
 * ordenados por clave, así que las letras de una misma UEA (CR43, CR43A, CR43B…) quedan
 * contiguas; esto solo marca dónde poner el encabezado que las agrupa.
 */
export function claveHeaderPositions(
  order: readonly number[],
  claveOf: (index: number) => string,
): ReadonlySet<number> {
  const positions = new Set<number>();
  let previous: string | null = null;
  order.forEach((groupIndex, position) => {
    const clave = claveOf(groupIndex);
    if (clave !== previous) {
      positions.add(position);
      previous = clave;
    }
  });
  return positions;
}
