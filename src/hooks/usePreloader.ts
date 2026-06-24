import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { GameContextType, SceneData, UsePreloaderResult } from '../types/interfaces';
import { getAssetPath } from '../utils/assetPath';
import { preloadIcons } from './useSvgIcon';
import { ICONS } from '../constants/constants';
import { GameContext } from '../contexts/GameContext';
import { useTranslations } from './useTranslations';
import { loadGlossaryData } from '../services/GlossaryService';

export const usePreLoader = (sceneData: SceneData[]): UsePreloaderResult => {
  const { isTranslationsLoaded, setIsTranslationsLoaded } = useContext(GameContext) as GameContextType;
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const { loadTranslations } = useTranslations();

  const resourceUrls = useMemo(() => {
    const urls: string[] = [];
    if (!sceneData) {
      return urls;
    }

    sceneData.forEach((scene) => {
      if (scene.background.url) {
        urls.push(getAssetPath(scene.background.url));
      }

      if (scene.audioUrl) {
        urls.push(getAssetPath(scene.audioUrl));
      }

      if (scene.dialogs.length) {
        scene.dialogs.forEach((dialog) => {
          if (dialog.avatar?.src) {
            urls.push(getAssetPath(dialog.avatar.src));
          }
          if (dialog.audioUrl) {
            urls.push(getAssetPath(dialog.audioUrl));
          }
        });
      }
    });

    return [...new Set(urls)];
  }, [sceneData]);

  useEffect(() => {
    if (!resourceUrls.length || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    let loadedResources = 0;
    let isMounted = true;

    const preloadResource = (url: string): Promise<void> => {
      if (url.endsWith('.mp3')) {
        return new Promise((resolve, reject) => {
          const audio = new Audio();
          audio.src = url;
          audio.onloadeddata = () => {
            loadedResources++;
            if (isMounted) {
              setLoadingProgress((loadedResources / resourceUrls.length) * 100);
            }
            resolve();
          };
          audio.onerror = () => reject(`Failed to load audio: ${url}`);
        });
      } else {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            loadedResources++;
            if (isMounted) {
              setLoadingProgress((loadedResources / resourceUrls.length) * 100);
            }
            resolve();
          };
          img.onerror = () => reject(`Failed to load image: ${url}`);
        });
      }
    };

    Promise.all([
      ...resourceUrls.map(preloadResource),
      preloadIcons(Object.values(ICONS)),
      loadGlossaryData(),
      loadTranslations(),
    ])
      .then(() => {
        if (isMounted) {
          setIsLoading(false);
          setLoadingProgress(100);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      isLoadingRef.current = false;
      setIsTranslationsLoaded(false);
    };
  }, [resourceUrls, loadTranslations, setIsTranslationsLoaded]);

  return { isLoading: isLoading || !isTranslationsLoaded, loadingProgress, error };
};
