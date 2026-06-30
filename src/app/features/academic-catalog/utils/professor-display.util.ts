import { ProfessorCatalogItem, ProfessorReference } from '../../../models';
import { formatPersonName } from '../../../shared/utils/person-name.util';

export function formatProfessorName(professor: ProfessorReference | null | undefined): string {
  if (!professor) {
    return '';
  }

  return formatPersonName(professor, 'last-first');
}

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
