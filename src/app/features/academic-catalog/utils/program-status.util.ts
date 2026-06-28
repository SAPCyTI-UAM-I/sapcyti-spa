import type { ProgramStatus } from '../../../models';

/** PrimeNG `p-tag` severities used for student program statuses. */
export type ProgramStatusSeverity = 'success' | 'info' | 'warn';

/** Maps a program status to the matching PrimeNG `p-tag` severity. */
export function programStatusSeverity(status: ProgramStatus): ProgramStatusSeverity {
  switch (status) {
    case 'ACTIVO':
      return 'success';
    case 'BAJA':
      return 'warn';
    case 'EGRESADO':
      return 'info';
  }
}
