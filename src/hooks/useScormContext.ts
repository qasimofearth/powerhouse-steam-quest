import { useContext } from 'react';
import { ScormContext } from '../contexts/ScormContext';

export const useScormContext = () => {
  const context = useContext(ScormContext);
  if (!context) {
    throw new Error('useScormContext must be used within a ScormProvider');
  }
  return context;
};
