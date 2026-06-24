import { useEffect, useState } from 'react';
import { SceneData } from '../types/interfaces';

export const useSceneData = () => {
  const [sceneData, setSceneData] = useState<SceneData[]>([]);
  const gameId = import.meta.env.VITE_GAME_ID;

  useEffect(() => {
    const loadSceneData = async () => {
      try {
        const module = await import(`../GAME_DATA/${gameId}/sceneData.ts`);
        setSceneData(module.sceneData);
      } catch (error) {
        console.error('Failed to load scene data:', error);
        setSceneData([]);
      }
    };

    loadSceneData();
  }, [gameId]);

  return sceneData;
};
