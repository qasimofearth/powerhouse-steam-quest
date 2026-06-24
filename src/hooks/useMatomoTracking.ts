import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    _paq: unknown[];
  }
}

const HEARTBEAT_INTERVAL = 15; // seconds

export const useMatomoTracking = (currentSceneIndex: number, sceneType: string, questTitle: string) => {
  const prevSceneRef = useRef<number>(currentSceneIndex);

  useEffect(() => {
    // Initialize Matomo tracking if not already initialized
    if (!window._paq) {
      window._paq = [];
    }

    // Enable heartbeat timer with more frequent updates
    window._paq.push(['enableHeartBeatTimer', HEARTBEAT_INTERVAL]);
    
    // Set default tracking settings
    window._paq.push(['setCustomDimension', 1, questTitle]); // Track quest title
    window._paq.push(['trackPageView']);

    // Cleanup on unmount
    return () => {
      // Send final tracking before component unmounts
      window._paq.push(['trackPageView']);
    };
  }, [questTitle]);

  useEffect(() => {
    if (prevSceneRef.current !== currentSceneIndex) {
      // Create a meaningful page title and URL
      const pageTitle = `${questTitle} - Scene ${currentSceneIndex} (${sceneType})`;
      const virtualUrl = `/scene/${currentSceneIndex}`;

      // Reset the custom variables and pageview
      window._paq.push(['setCustomUrl', virtualUrl]);
      window._paq.push(['setDocumentTitle', pageTitle]);
      window._paq.push(['setCustomDimension', 2, String(currentSceneIndex)]); // Track scene index
      window._paq.push(['setCustomDimension', 3, sceneType]); // Track scene type

      // Track engagement time for the previous scene before moving to new scene
      if (prevSceneRef.current >= 0) {
        window._paq.push(['trackPageView']);
      }

      // Track the new pageview
      window._paq.push(['trackPageView']);

      prevSceneRef.current = currentSceneIndex;
    }
  }, [currentSceneIndex, sceneType, questTitle]);

  // Track custom events
  const trackEvent = (category: string, action: string, name?: string, value?: number) => {
    window._paq.push(['trackEvent', category, action, name, value]);
  };

  return { trackEvent };
};