import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  SupportedLanguage,
} from './language.constants';

export function getRequestLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // private browsing or storage blocked
  }

  return DEFAULT_LANGUAGE;
}
