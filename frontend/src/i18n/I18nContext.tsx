import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

export type Language = 'en-US' | 'en-GB' | 'de' | 'fr' | 'es' | 'it' | 'pl' | 'ru' | 'uk';

interface I18nContextProps {
  locale: Language;
  setLocale: (locale: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Language>(() => {
    const saved = localStorage.getItem('locale') as Language;
    if (saved && translations[saved]) {
      return saved;
    }
    return 'en-US'; // default to American English
  });

  const setLocale = (newLocale: Language) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = (key: string): string => {
    const dictionary = translations[locale] || translations['en-US'];
    return dictionary[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
