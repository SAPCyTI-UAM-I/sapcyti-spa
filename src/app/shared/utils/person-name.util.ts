export interface PersonNameParts {
  readonly firstName: string;
  readonly firstLastName: string;
  readonly secondLastName?: string | null;
}

/** `first-last` → "Ada Lovelace King"; `last-first` → "Lovelace King Ada". */
export type PersonNameOrder = 'first-last' | 'last-first';

export function formatPersonName(
  parts: PersonNameParts,
  order: PersonNameOrder = 'first-last',
): string {
  const ordered =
    order === 'last-first'
      ? [parts.firstLastName, parts.secondLastName, parts.firstName]
      : [parts.firstName, parts.firstLastName, parts.secondLastName];
  return ordered.filter((part): part is string => !!part?.trim()).join(' ');
}
