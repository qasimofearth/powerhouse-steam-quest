import { useContext, useCallback } from 'react';
import { GameContext } from '../contexts/GameContext';
import { GameContextType } from '../types/interfaces';

interface Translations {
  [key: string]: string | Translations;
}

const flattenTranslations = (obj: Translations, prefix = ''): Record<string, string> => {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(acc, flattenTranslations(obj[key] as Translations, newKey));
      } else {
        acc[newKey] = obj[key] as string;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
};

export const useTranslations = () => {
  const { language, setIsTranslationsLoaded, translations, setTranslations, isTranslationsLoaded } = useContext(
    GameContext,
  ) as GameContextType;

  const gameId = import.meta.env.VITE_GAME_ID;

  const loadTranslations = useCallback(async () => {
    try {
      setIsTranslationsLoaded(false);
      const translationModule = await import(`../GAME_DATA/${gameId}/locales/${language}.json`);
      setTranslations(flattenTranslations(translationModule.default));
      setIsTranslationsLoaded(true);
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to English if translation file not found
      const englishModule = await import(`../GAME_DATA/${gameId}/locales/en.json`);
      setTranslations(flattenTranslations(englishModule.default));
      setIsTranslationsLoaded(true);
      console.warn(`Translation file not found for ${language}, falling back to English`);
    }
  }, [gameId, language, setIsTranslationsLoaded, setTranslations]);

  const t = useCallback(
    (key: string) => {
      try {
        if (!isTranslationsLoaded) {
          return key;
        }

        const value = translations[key];

        if (value === undefined) return key;

        return value;
      } catch (error) {
        console.error('Error loading translations:', error);
        return key;
      }
    },
    [isTranslationsLoaded, translations],
  );

  return { t, language, loadTranslations };
};
