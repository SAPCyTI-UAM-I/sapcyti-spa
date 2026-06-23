import { ProfessorCatalogItem, ProfessorReference } from '../../../models';

export function formatProfessorName(professor: ProfessorReference | null | undefined): string {
  if (!professor) {
    return '';
  }

  return [professor.firstLastName, professor.secondLastName, professor.firstName]
    .filter((part): part is string => !!part?.trim())
    .join(' ');
}

export function professorToOption(professor: ProfessorCatalogItem): {
  label: string;
  value: number;
} {
  return { label: formatProfessorName(professor), value: professor.id };
}
