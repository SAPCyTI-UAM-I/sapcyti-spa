import { ProfessorCatalogItem, ProfessorReference } from '../../../models';
import { formatProfessorName } from '../../../shared/utils/person-name.util';

export { formatProfessorName };

export function professorToOption(professor: ProfessorCatalogItem): {
  label: string;
  value: number;
} {
  return { label: formatProfessorName(professor), value: professor.id };
}

export function professorReferenceToOption(professor: ProfessorReference): {
  label: string;
  value: number;
} {
  return { label: formatProfessorName(professor), value: professor.id };
}
