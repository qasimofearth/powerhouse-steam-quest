import { createContext } from 'react';
import { SceneTransitionContextType } from '../types/interfaces';

export const SceneTransitionContext = createContext<SceneTransitionContextType | null>(null);
