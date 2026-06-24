import 'animate.css';
import React, { useEffect, useMemo, useState } from 'react';
import { useGameContext } from '../hooks/useGameContext';
import { useSceneTransitionContext } from '../hooks/useSceneTransitionContext';
import { SceneProps } from '../types/interfaces';
import Background from './Background';
import ConfettiComponent from './Confetti';
import Logo from './Logo';
import OneAtATime from './OneAtATime';
import './Scene.css';
import SplitScreenChat from './SplitScreenChat';
import { setGlossaryItems } from '../services/GlossaryService';
import TurnBasedChat from './TurnBasedChat';
import { Direction, DURATIONS, GAME_TITLES, SceneType } from '../constants/constants';
import ProgressBar from './ProgressBar';
import { debounceLeading } from '../utils/debounce';
import EndScreen from './EndScreen';
import { useMatomoTracking } from '../hooks/useMatomoTracking';
import { useTranslations } from '../hooks/useTranslations';
import { useQueryParams } from '../hooks/useQueryParams';
import { isStagingUrl } from '../utils/isStagingUrl';

const Scene: React.FC<SceneProps> = ({ sceneData }) => {
  const { currentSceneIndex, dialogIndex, isTranslationsLoaded, language, setShowContent, showContent } = useGameContext();
  const { handleDirectionalSceneTransition, isTransitioningForward } = useSceneTransitionContext();
  const [showConfettiAnimation, setShowConfettiAnimation] = useState(false);
  const { setQueryParam } = useQueryParams();
  const { t } = useTranslations();
  const gameId = import.meta.env.VITE_GAME_ID;
  const title = t(GAME_TITLES.get(gameId) || '');

  const currentScene = useMemo(() => sceneData[currentSceneIndex], [currentSceneIndex, sceneData]);

  // Initialize Matomo tracking
  const { trackEvent } = useMatomoTracking(
    currentSceneIndex,
    currentScene.type,
    title
  );

  // Track scene transitions with the debounced handler
  const debouncedDirectionalSceneTransitionHandler = useMemo(
    () => debounceLeading((direction: Direction) => {
      // Track the transition event before changing scenes
      trackEvent(
        'Navigation',
        direction === Direction.NEXT ? 'Next Scene' : 'Previous Scene',
        `${title} - Scene ${currentSceneIndex}`,
        currentSceneIndex
      );
      
      handleDirectionalSceneTransition(direction);
    }, DURATIONS.turnBasedChatOpacity),
    [handleDirectionalSceneTransition, trackEvent, currentSceneIndex, title]
  );

  // Track dialog progression
  useEffect(() => {
    if (currentScene.type === SceneType.OneAtATime) {
      trackEvent(
        'Dialog',
        'Progress',
        `${title} - Scene ${currentSceneIndex}`,
        dialogIndex
      );
    }

    // Only update query parameters in staging environment
    if (isStagingUrl()) {
      try {
        setQueryParam('scene', currentSceneIndex.toString());
        setQueryParam('dialog', dialogIndex.toString());
      } catch (error) {
        console.warn('Failed to update query parameters:', error);
      }
    }
  }, [dialogIndex, currentSceneIndex, currentScene.type, trackEvent, title, setQueryParam]);

  const dialogState = useMemo(() => {
    if (currentScene.type === 'one-at-a-time') {
      return currentScene.dialogs[dialogIndex];
    }
    return undefined;
  }, [currentScene, dialogIndex]);

  useEffect(() => {
    const waitDelay = currentScene.background?.waitDelay;
    const showConfetti = sceneData[currentSceneIndex].showConfetti || false;
    setShowContent(false);
    setShowConfettiAnimation(!waitDelay ? showConfetti : false);

    if (waitDelay && isTransitioningForward) {
      const timer = setTimeout(() => {
        setShowContent(true);
        setShowConfettiAnimation(showConfetti);
      }, waitDelay);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [sceneData, currentSceneIndex, isTransitioningForward, currentScene.background?.waitDelay]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'ArrowRight') {
          handleDirectionalSceneTransition(Direction.NEXT);
        } else if (event.key === 'ArrowLeft') {
          handleDirectionalSceneTransition(Direction.BACK);
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleDirectionalSceneTransition]);

  useEffect(() => {
    if (isTranslationsLoaded && language) {
      setGlossaryItems(language);
    }
  }, [language, isTranslationsLoaded]);

  const renderDialog = () => {
    const commonProps = {
      currentScene,
      dialogIndex,
      onNext: () => debouncedDirectionalSceneTransitionHandler(Direction.NEXT),
      onBack: () => debouncedDirectionalSceneTransitionHandler(Direction.BACK),
    };
    switch (currentScene.type) {
      case SceneType.OneAtATime:
        return <OneAtATime {...commonProps} />;

      case SceneType.TurnBasedChat:
        return <TurnBasedChat {...commonProps} />;

      case SceneType.SplitScreenChat:
        return <SplitScreenChat {...commonProps} sceneIndex={currentSceneIndex} />;

      case SceneType.EndScreen:
        return <EndScreen {...commonProps} />;

      default:
        console.warn(`Unknown dialog type: ${currentScene.type}`);
        return null;
    }
  };

  const shouldShowProgress = useMemo(() => {
    return currentSceneIndex !== 0;
  }, [currentSceneIndex]);

  const renderLogo = () => {
    if (currentSceneIndex !== 0) return null;

    const logoSceneIndex = sceneData.findIndex((scene) => scene.logoTheme);
    if (logoSceneIndex === -1) return null;

    return (
      <Logo
        logoThemeLandScape={sceneData[logoSceneIndex].logoTheme?.landscape}
        logoThemePortrait={sceneData[logoSceneIndex].logoTheme?.portrait}
        customLogoUrl={sceneData[logoSceneIndex].customLogoUrl}
      />
    );
  };

  return (
    <div className="scene relative h-full">
      <Background
        alt={currentScene.background.alt}
        pan={dialogState?.background?.pan || currentScene.background.pan}
        zoom={dialogState?.background?.zoom || currentScene.background.zoom}
        backgroundImage={currentScene.background.url}
        blur={dialogState?.background?.blur || currentScene.background.blur}
        waitDelay={isTransitioningForward ? currentScene.background.waitDelay : undefined}
        initialZoom={isTransitioningForward ? currentScene.background.initialZoom : undefined}
      />

      {showContent && (
        <div className="flex" aria-live="polite">
        {renderLogo()}
        {renderDialog()}
        {showConfettiAnimation && <ConfettiComponent />}
      </div>
      )}
      <ProgressBar
        isVisible={shouldShowProgress}
        scenes={sceneData}
        currentSceneIndex={currentSceneIndex}
        currentSceneDialogIndex={dialogIndex + 1}
      />
    </div>
  );
};

export default Scene;