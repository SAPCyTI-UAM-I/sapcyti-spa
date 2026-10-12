import {
  documentFileNameAliases,
  localizeDocumentFileName,
  resolveDocumentNameLanguage,
} from './exam-document-name.util';

describe('exam-document-name.util', () => {
  it('localizes regulated prefixes without touching the person segments', () => {
    expect(localizeDocumentFileName('Tesis_Mtria_Garcia_Ruiz_Maria.pdf', 'en')).toBe(
      'Thesis_Mtria_Garcia_Ruiz_Maria.pdf',
    );
    expect(localizeDocumentFileName('Sol_Sinodales_Pena_Nunez_Maria_Jose.pdf', 'en')).toBe(
      'Faculty_Committee_Pena_Nunez_Maria_Jose.pdf',
    );
    expect(localizeDocumentFileName('Hist_Acad_Chen_Wei.pdf', 'en')).toBe(
      'Academic_Record_Chen_Wei.pdf',
    );
    expect(localizeDocumentFileName('Thesis_Mtria_Garcia_Ruiz_Maria.pdf', 'es')).toBe(
      'Tesis_Mtria_Garcia_Ruiz_Maria.pdf',
    );
    expect(localizeDocumentFileName(null, 'en')).toBeNull();
  });

  it('keeps both language aliases for validation', () => {
    expect(documentFileNameAliases('Tesis_Mtria_Garcia_Ruiz_Maria.pdf')).toEqual([
      'Tesis_Mtria_Garcia_Ruiz_Maria.pdf',
      'Thesis_Mtria_Garcia_Ruiz_Maria.pdf',
    ]);
    expect(documentFileNameAliases('historia.pdf')).toEqual(['historia.pdf']);
    expect(resolveDocumentNameLanguage('en')).toBe('en');
    expect(resolveDocumentNameLanguage('es')).toBe('es');
    expect(resolveDocumentNameLanguage('fr')).toBe('es');
  });
});
