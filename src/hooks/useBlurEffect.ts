import { useEffect, useState } from 'react';
import { BlurConfig } from '../types/interfaces';
import { useGameContext } from './useGameContext';

export const useBlurEffect = (blur: number | BlurConfig, waitDelay = 0) => {
  const [currentBlur, setCurrentBlur] = useState<BlurConfig>({ amount: 0 });
  const { currentSceneIndex } = useGameContext();

  const getBlurConfig = (blur: number | BlurConfig): BlurConfig => {
    return typeof blur === 'number' ? { amount: blur } : blur;
  };

  useEffect(() => {
    setCurrentBlur({ amount: 0 });
    if (waitDelay) {
      const INITIAL_PAUSE = waitDelay;
      const ANIMATION_DURATION = 200; //ms
      const ANIMATION_STEPS = 20; // smoothness, more steps = smoother animation
      const innerTimers: NodeJS.Timeout[] = [];

      const timer = setTimeout(() => {
        const targetBlur = getBlurConfig(blur);
        const step = 1 / ANIMATION_STEPS;

        for (let i = 0; i <= 1; i += step) {
          const innerTimer = setTimeout(() => {
            setCurrentBlur({ amount: i * targetBlur.amount, radius: i * (targetBlur.radius || 25) });
          }, i * ANIMATION_DURATION);
          innerTimers.push(innerTimer);
        }
      }, INITIAL_PAUSE);

      return () => {
        clearTimeout(timer);
        innerTimers.forEach(clearTimeout);
      };
    } else {
      setCurrentBlur(getBlurConfig(blur));
    }
  }, [blur, waitDelay, currentSceneIndex]);

  const blurFilter = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a' x='0' y='0' width='1' height='1' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='${
    currentBlur.amount
  }' result='b'/%3E%3CfeMorphology operator='dilate' radius='${
    currentBlur.radius || 25
  }'/%3E %3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='b'/%3E%3C/feMerge%3E%3C/filter%3E %3C/svg%3E#a")`;
  return { blurFilter, currentBlurAmount: currentBlur.amount };
};
