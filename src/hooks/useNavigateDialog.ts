import { useCallback } from 'react';
import { BUTTON_STYLES } from '../constants/constants';
import { ButtonVariant } from '../types/interfaces';
import { useSceneTransitionContext } from './useSceneTransitionContext';

export const useNavigateDialog = () => {
  const {
    handleExactSceneTransition,
    branchState: { resolvePath },
  } = useSceneTransitionContext();

  const handleNavigate = useCallback(
    (destination: string) => {
      const { startSceneIndex, startDialogIndex } = resolvePath(destination);
      handleExactSceneTransition({ nextSceneIndex: startSceneIndex, nextDialogIndex: startDialogIndex });
    },
    [handleExactSceneTransition, resolvePath],
  );

  const applyButtonStyles = useCallback((button: HTMLButtonElement) => {
    Object.entries(BUTTON_STYLES.base).forEach(([prop, value]) => {
      // @ts-expect-error Some style are readonly, and we know what we're doing
      button.style[prop] = value;
    });
    const variant = (button.getAttribute('data-variant') || 'primary') as ButtonVariant;
    button.className = `${button.className} ${BUTTON_STYLES.classes.common} ${BUTTON_STYLES.classes[variant].enabled}`;
  }, []);

  return {
    handleNavigate,
    applyButtonStyles,
  };
};
