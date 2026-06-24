import React, { useState } from 'react';
import { useQueryParams } from '../hooks/useQueryParams';
import { GameProviderProps, PopoverState, ResponseState } from '../types/interfaces';
import { GameContext } from './GameContext';

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { getQueryParam } = useQueryParams();
  const paramSceneIndex = getQueryParam('scene');
  const paramDialogIndex = getQueryParam('dialog');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(paramSceneIndex ? parseInt(paramSceneIndex) : 0);
  const [dialogIndex, setDialogIndex] = useState(paramDialogIndex ? parseInt(paramDialogIndex) : 0);
  const [language, setLanguage] = useState(() => {
    return getQueryParam('lang') || 'en';
  });
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  const [responses, setResponses] = useState<ResponseState[]>([]);
  const [isTranslationsLoaded, setIsTranslationsLoaded] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [sceneProgressCount, setSceneProgressCount] = useState<number>(0);
  const [interactiveResponses, setInteractiveResponses] = useState<Record<string, Record<string, string | number | boolean | null>>>({});
  const [showContent, setShowContent] = useState(false);

  return (
    <GameContext.Provider
      value={{
        currentSceneIndex,
        setCurrentSceneIndex,
        dialogIndex,
        setDialogIndex,
        language,
        setLanguage,
        popoverState,
        setPopoverState,
        responses,
        setResponses,
        isTranslationsLoaded,
        setIsTranslationsLoaded,
        translations,
        setTranslations,
        sceneProgressCount,
        setSceneProgressCount,
        interactiveResponses,
        setInteractiveResponses,
        showContent,
        setShowContent,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
