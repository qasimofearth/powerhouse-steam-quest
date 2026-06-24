import { GlossaryEntry, GlossaryItem } from '../types/interfaces';

let glossaryCache: GlossaryEntry[] | null = null;
let glossaryItems: GlossaryItem[] | null = null;

export const loadGlossaryData = async (): Promise<GlossaryEntry[]> => {
  if (glossaryCache !== null) return glossaryCache;

  try {
    const response = await import('../assets/glossary/glossary.json');
    const data: GlossaryEntry[] = response.default;
    glossaryCache = data;
    return data;
  } catch (error) {
    console.error('Error loading glossary:', error);
    return [];
  }
};

export const convertToGlossaryItems = (currentLanguage: string) => {
  if (glossaryCache === null) {
    console.error('Glossary cache is null');
    return;
  }
  if (currentLanguage === 'es') {
    glossaryItems = glossaryCache.map((entry) => ({
      word: entry.spanishTerm,
      definitionAsHtml: entry.spanishDefinition,
      global: true,
    }));
  } else {
    glossaryItems = glossaryCache.map((entry) => ({
      word: entry.englishTerm,
      definitionAsHtml: entry.englishDefinition,
      global: true,
    }));
  }
};

export const setGlossaryItems = (currentLanguage: string) => {
  convertToGlossaryItems(currentLanguage);
};

export const getGlossaryItems = (): GlossaryItem[] => {
  if (glossaryItems === null) {
    console.error('Global glossary items are null');
    return [];
  }
  return glossaryItems;
};
