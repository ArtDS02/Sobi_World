// The language in use, kept apart from the string tables so formatting code can ask for it cheaply.
export const LANGUAGES = ['vi', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'vi';

let current: Language = DEFAULT_LANGUAGE;

export const setCurrentLanguage = (language: Language): void => {
  current = language;
};
export const currentLanguage = (): Language => current;

/** BCP 47 tag for Intl formatting. */
export const currentLocale = (): string => (current === 'en' ? 'en-US' : 'vi-VN');
