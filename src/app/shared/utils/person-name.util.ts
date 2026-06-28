export interface PersonNameParts {
  readonly firstName: string;
  readonly firstLastName: string;
  readonly secondLastName?: string | null;
}

export function formatPersonName(parts: PersonNameParts): string {
  return [parts.firstName, parts.firstLastName, parts.secondLastName]
    .filter((part): part is string => !!part?.trim())
    .join(' ');
}
