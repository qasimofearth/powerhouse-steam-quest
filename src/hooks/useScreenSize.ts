import { useState, useEffect } from 'react';
import { SCREEN_CONSTANTS } from '../constants/constants';

const useScreenSize = () => {
  const [isVerticalScreen, setIsVerticalScreen] = useState(false);
  const [isZoomed200, setIsZoomed200] = useState(false);

  useEffect(() => {
    const updateScreenSize = () => {
      const height = window.innerHeight;
      const innerWidth = window.innerWidth;
      const outerWidth = window.outerWidth;
      setIsVerticalScreen(height > innerWidth);
      setIsZoomed200(outerWidth / innerWidth >= SCREEN_CONSTANTS.ZOOM_LEVELS.DPR_200_MIN);
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  return {
    isVerticalScreen,
    isZoomed200,
  };
};

export default useScreenSize;
