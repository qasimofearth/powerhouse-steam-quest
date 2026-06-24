import { useState, useEffect } from 'react';
import { scormService } from '../services/ScormService';
import { ScormContext } from './ScormContext';

export const ScormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialized = scormService.initialize();
    setIsInitialized(initialized);
    if (initialized) {
      startSessionTime();
    }
    return () => {
      if (initialized) {
        scormService.terminate();
        endSessionTime();
      }
    };
  }, []);

  const setScore = (score: number, minScore?: number, maxScore?: number) => {
    scormService.setScore(score, minScore, maxScore);
    scormService.commit('');
  };

  const setStatus = (status: 'completed' | 'incomplete' | 'failed' | 'passed') => {
    scormService.setStatus(status);
    scormService.commit('');
  };

  const setLocation = (location: string) => {
    scormService.setLocation(location);
    scormService.commit('');
  };

  const startSessionTime = () => {
    scormService.startSessionTime();
    scormService.commit('');
  };

  const endSessionTime = () => {
    scormService.endSessionTime();
    scormService.commit('');
  };

  const getLearnerName = () => {
    return scormService.getValue('cmi.core.student_name');
  };

  return (
    <ScormContext.Provider
      value={{
        isInitialized,
        setScore,
        setStatus,
        getLearnerName,
        setLocation,
      }}
    >
      {children}
    </ScormContext.Provider>
  );
};
