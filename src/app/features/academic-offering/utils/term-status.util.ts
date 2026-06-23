import type { AcademicTermStatus } from '../../../models';

/** PrimeNG `p-tag` severities used for academic term/plan statuses. */
export type TermStatusSeverity = 'success' | 'info' | 'warn';

/** Maps a term/plan status to the matching PrimeNG `p-tag` severity. */
export function termStatusSeverity(status: AcademicTermStatus): TermStatusSeverity {
  switch (status) {
    case 'EDITED':
      return 'success';
    case 'IN_ENROLLMENT':
      return 'info';
    case 'PRELIMINARY':
      return 'warn';
  }
}
