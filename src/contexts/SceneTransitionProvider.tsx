import React, { useState } from 'react';
import { useSceneTransition } from '../hooks/useSceneTransition';
import { SceneTransitionProviderProps } from '../types/interfaces';
import { SceneTransitionContext } from './SceneTransitionContext';
import { useBranchState } from '../hooks/useBranchState';

export const SceneTransitionProvider: React.FC<SceneTransitionProviderProps> = ({ children, sceneData }) => {
  const [isTransitioningForward, setIsTransitioningForward] = useState(true);
  const branchState = useBranchState(sceneData);
  const { handleDirectionalSceneTransition, handleExactSceneTransition } = useSceneTransition(
    sceneData,
    setIsTransitioningForward,
    branchState,
  );

  return (
    <SceneTransitionContext.Provider
      value={{
        handleDirectionalSceneTransition,
        handleExactSceneTransition,
        isTransitioningForward,
        branchState,
      }}
    >
      {children}
    </SceneTransitionContext.Provider>
  );
};
