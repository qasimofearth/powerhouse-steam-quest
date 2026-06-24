import { useContext } from 'react';
import { SceneTransitionContext } from '../contexts/SceneTransitionContext';

export const useSceneTransitionContext = () => {
  const context = useContext(SceneTransitionContext);
  if (!context) {
    throw new Error('useSceneTransitionContext must be used within a SceneTransitionProvider');
  }
  return context;
};
