import { BUTTON_SHAKING_INTERVAL } from '../constants/constants';
import { useGameContext } from '../hooks/useGameContext';
import { useTranslations } from '../hooks/useTranslations';
import { useEffect, useRef, useState } from 'react';
import { calculatePopoverPosition } from '../utils/popoverPosition';
import './SmallIconButton.css';

interface SmallIconButtonProps {
  type: 'info' | 'help';
  content: {
    heading: string;
    body?: string;
    bodyAsHtml?: string;
    accentColor?: string;
  };
  shouldShake?: boolean;
}

const SmallIconButton = ({ type, content, shouldShake = true }: SmallIconButtonProps) => {
  const { setPopoverState, popoverState } = useGameContext();
  const { t } = useTranslations();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [isShaking, setIsShaking] = useState(false);
  const isPopoverOpen = popoverState !== null;
  const shakeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (shakeIntervalRef.current) {
      clearInterval(shakeIntervalRef.current);
    }

    if (shouldShake && !isPopoverOpen) {
      shakeIntervalRef.current = setInterval(() => {
        setIsShaking((prev) => !prev);
      }, BUTTON_SHAKING_INTERVAL);
    } else {
      setIsShaking(false);
    }

    return () => {
      if (shakeIntervalRef.current) {
        clearInterval(shakeIntervalRef.current);
      }
    };
  }, [shouldShake, isPopoverOpen]);

  const icon = type === 'info' ? 'i' : '?';

  const handleClick = () => {
    if (!buttonRef.current) return;

    if (isPopoverOpen) {
      setPopoverState(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const { x, y } = calculatePopoverPosition(rect, 30);

    setPopoverState({
      ...content,
      position: { x, y },
      triggerRef: buttonRef,
    });
  };

  return (
    <div
      ref={buttonRef}
      className={`relative flex cursor-pointer ${isShaking ? 'animate-[custom-bounce_1s_ease-in-out_1]' : ''}`}
      onClick={handleClick}
      onKeyUp={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      aria-label={t(`scenes.common.${type}`)}
      tabIndex={0}
    >
      {type === 'help' && (
        <span className="underline font-bold mr-1" style={{ color: content.accentColor }}>
          {t('scenes.common.help')}
        </span>
      )}
      <span
        className="w-5 h-5 p-3 rounded-full transition-colors flex items-center justify-center text-white text-m"
        style={{
          backgroundColor: content.accentColor,
          textDecorationLine: type === 'help' ? 'underline' : 'none',
        }}
      >
        {icon}
      </span>
    </div>
  );
};

export default SmallIconButton;
