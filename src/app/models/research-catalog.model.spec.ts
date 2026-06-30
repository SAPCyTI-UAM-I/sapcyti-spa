import {
  getAreasForLine,
  getLineOfKnowledgeLabelKey,
  getResearchAreaLabelKey,
  isAreaInLine,
  toLineOfKnowledgeOptions,
  toResearchAreaOptions,
  RESEARCH_CATALOG,
} from './research-catalog.model';

describe('ResearchCatalogModel', () => {
  describe('getAreasForLine', () => {
    it('returns the areas for a known line of knowledge', () => {
      const areas = getAreasForLine('Ciencias e Ingeniería de la Computación');
      expect(areas).toContain('Inteligencia artificial');
      expect(areas).toHaveLength(5);
    });

    it('returns empty array for an unknown line of knowledge', () => {
      const areas = getAreasForLine('Inexistente');
      expect(areas).toEqual([]);
    });
  });

  describe('isAreaInLine', () => {
    it('returns true if the area belongs to the line of knowledge', () => {
      expect(
        isAreaInLine('Ciencias e Ingeniería de la Computación', 'Inteligencia artificial'),
      ).toBe(true);
      expect(isAreaInLine('Redes de Comunicaciones', 'Comunicaciones inalámbricas')).toBe(true);
    });

    it('returns false if the area does not belong to the line of knowledge', () => {
      expect(
        isAreaInLine('Ciencias e Ingeniería de la Computación', 'Comunicaciones inalámbricas'),
      ).toBe(false);
    });

    it('returns false if the line of knowledge is unknown', () => {
      expect(isAreaInLine('Inexistente', 'Inteligencia artificial')).toBe(false);
    });
  });

  describe('i18n mapping helpers', () => {
    it('maps known catalog values to translation keys', () => {
      expect(getLineOfKnowledgeLabelKey('Ciencias e Ingeniería de la Computación')).toBe(
        'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.LINES.COMPUTER_SCIENCE',
      );
      expect(getResearchAreaLabelKey('Inteligencia artificial')).toBe(
        'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.AI',
      );
    });

    it('returns null for unknown catalog values', () => {
      expect(getLineOfKnowledgeLabelKey('Inexistente')).toBeNull();
      expect(getResearchAreaLabelKey('Área inexistente')).toBeNull();
    });

    it('builds translated line and area options for the UI layer', () => {
      const lineOptions = toLineOfKnowledgeOptions(RESEARCH_CATALOG);
      const areaOptions = toResearchAreaOptions(
        RESEARCH_CATALOG,
        'Ciencias e Ingeniería de la Computación',
      );

      expect(lineOptions[0]).toEqual({
        value: 'Ciencias e Ingeniería de la Computación',
        labelKey: 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.LINES.COMPUTER_SCIENCE',
      });
      expect(areaOptions).toContainEqual({
        value: 'Inteligencia artificial',
        labelKey: 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.AI',
      });
    });
  });
});
