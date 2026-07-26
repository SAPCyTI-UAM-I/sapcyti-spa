/**
 * Bloques horarios de captura (HU-59).
 *
 * El contrato es `"HH:mm"` 24h con cero a la izquierda: el backend lo valida con
 * regex y compara `start < end` como **texto**, así que el formato es funcional,
 * no cosmético. `<input type="time">` cumplía el contrato pero se dibuja según el
 * locale del sistema operativo, de modo que el coordinador podía leer «3:00 p.m.»
 * y encontrarse «15:00» en el Excel. La rejilla evita esa discrepancia y de paso
 * quita el tecleo: los horarios del PCyTI caen siempre en horas y medias horas.
 */

const FIRST_HOUR = 7;
const LAST_HOUR = 22;
const STEP_MINUTES = 30;

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = FIRST_HOUR * 60; minutes <= LAST_HOUR * 60; minutes += STEP_MINUTES) {
    const hours = Math.floor(minutes / 60);
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
  }
  return slots;
}

export const TIME_SLOTS: readonly string[] = buildSlots();

/**
 * Un valor capturado antes de existir la rejilla (o fuera de ella) se inserta en
 * su lugar: sin esto el select lo mostraría vacío y lo borraría al guardar.
 */
function withPinned(slots: readonly string[], current: string): string[] {
  if (!current || slots.includes(current)) return [...slots];
  const pinned = [...slots, current];
  pinned.sort();
  return pinned;
}

export function startOptions(current: string): string[] {
  return withPinned(TIME_SLOTS, current);
}

/**
 * Memoizada por (inicio, valor fijado): PrimeNG vuelve a dibujar el desplegable
 * cuando cambia la identidad de `[options]`, y esto se evalúa en cada ciclo de
 * detección de cambios.
 */
const endOptionsCache = new Map<string, string[]>();

export function endOptions(start: string, current: string): string[] {
  const key = `${start}|${current}`;
  const cached = endOptionsCache.get(key);
  if (cached) return cached;

  const laterThanStart = start ? TIME_SLOTS.filter((slot) => slot > start) : TIME_SLOTS;
  const options = withPinned(laterThanStart, current);
  endOptionsCache.set(key, options);
  return options;
}
