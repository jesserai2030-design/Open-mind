import { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../localization/translations';

type TranslationSet = typeof translations.en;
export type TranslationKey = keyof TranslationSet;

export const useLocalization = () => {
  const { settings } = useContext(SettingsContext);
  const currentLanguage = settings.language;

  // FIX: Updated `t` function to handle placeholder replacements. This fixes an error where `t` was called with two arguments instead of one.
  const t = (key: TranslationKey, replacements?: Record<string, string>): string => {
    const langTranslations = translations[currentLanguage as keyof typeof translations];
    let message = (langTranslations && langTranslations[key]) 
      ? langTranslations[key] 
      : (translations.en[key] || key);

    if (replacements) {
      Object.keys(replacements).forEach((placeholder) => {
        message = message.replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }
    return message;
  };

  return { t, currentLanguage };
};
