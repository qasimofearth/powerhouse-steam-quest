import { createContext } from 'react';
import { ScormContextType } from '../types/interfaces';

export const ScormContext = createContext<ScormContextType | undefined>(undefined);
