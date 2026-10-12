import {
  documentFileNameAliases,
  localizeDocumentFileName,
  resolveDocumentNameLanguage,
} from './exam-document-name.util';

describe('exam-document-name.util', () => {
  it('localizes regulated prefixes without touching the person segments', () => {
    expect(localizeDocumentFileName('Tesis_Mtria_Lopez_Alba_Emanuel.pdf', 'en')).toBe(
      'Thesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );
    expect(localizeDocumentFileName('Sol_Sinodales_Lopez_Alba_Emanuel.pdf', 'en')).toBe(
      'Faculty_Committee_Lopez_Alba_Emanuel.pdf',
    );
    expect(localizeDocumentFileName('Hist_Acad_Lopez_Alba_Emanuel.pdf', 'en')).toBe(
      'Academic_Record_Lopez_Alba_Emanuel.pdf',
    );
    expect(localizeDocumentFileName('Thesis_Mtria_Lopez_Alba_Emanuel.pdf', 'es')).toBe(
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
    );
    expect(localizeDocumentFileName(null, 'en')).toBeNull();
  });

  it('keeps both language aliases for validation', () => {
    expect(documentFileNameAliases('Tesis_Mtria_Lopez_Alba_Emanuel.pdf')).toEqual([
      'Tesis_Mtria_Lopez_Alba_Emanuel.pdf',
      'Thesis_Mtria_Lopez_Alba_Emanuel.pdf',
    ]);
    expect(documentFileNameAliases('historia.pdf')).toEqual(['historia.pdf']);
    expect(resolveDocumentNameLanguage('en')).toBe('en');
    expect(resolveDocumentNameLanguage('es')).toBe('es');
    expect(resolveDocumentNameLanguage('fr')).toBe('es');
  });
});
