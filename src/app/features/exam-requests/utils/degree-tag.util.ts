import type { CatalogTagSeverity } from '../../../core/theme/design-tokens';
import type { Degree } from '../../../models';

/** Mapea el grado de examen a la severity del tag; no usa ProgramType del catálogo. */
export function degreeTagSeverity(degree: Degree): CatalogTagSeverity {
  switch (degree) {
    case 'ESPECIALIZACION':
      return 'especializacion';
    case 'MAESTRIA':
      return 'maestria';
    case 'DOCTORADO':
      return 'doctorado';
  }
}
