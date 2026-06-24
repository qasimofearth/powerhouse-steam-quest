import { createContext } from 'react';
import { GameContextType } from '../types/interfaces';

export const GameContext = createContext<GameContextType | null>(null);
