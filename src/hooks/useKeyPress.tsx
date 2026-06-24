import { useEffect } from 'react';
import { KEY_DOWN } from '../constants/constants';

type FocusableElement = HTMLInputElement | null;

interface KeyPressConfig {
  className: string;
  selector: string;
  keyPressed: KeyboardEvent['key'];
  callback: () => void;
}

const useKeyPress = ({ className, selector, keyPressed, callback }: KeyPressConfig): void => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key !== keyPressed) return;

      const focusedElement = document.querySelector(`${selector}.${className}:focus`) as FocusableElement;

      // onSubmit is called via tab key navigation and enter key is pressed
      if (focusedElement || document.querySelector(`${selector}.${className}`)) {
        callback();
      }
    };

    window.addEventListener(KEY_DOWN, handleKeyPress);
    return () => {
      window.removeEventListener(KEY_DOWN, handleKeyPress);
    };
  }, [callback, className, selector, keyPressed]);
};

export default useKeyPress;
