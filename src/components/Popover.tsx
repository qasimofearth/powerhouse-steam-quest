import { useSvgIcon } from '../hooks/useSvgIcon';
import parse from 'html-react-parser';
import { useTranslations } from '../hooks/useTranslations';
import { useGameContext } from '../hooks/useGameContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { MathJax } from 'better-react-mathjax';
import useScreenSize from '../hooks/useScreenSize';
import { KeyboardKeys, POPOVER_CONSTANTS } from '../constants/constants';

const isGlossaryPopover = (bodyAsHtml?: string, heading?: string): boolean => {
  return !heading && !!bodyAsHtml;
};

const Popover = () => {
  const { t } = useTranslations();
  const CloseIcon = useSvgIcon('close');
  const { popoverState, setPopoverState } = useGameContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { isZoomed200 } = useScreenSize();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  const isGlossary = popoverState ? isGlossaryPopover(popoverState.bodyAsHtml, popoverState.heading) : false;

  useEffect(() => {
    if (popoverState?.position) {
      setPosition(popoverState.position);
      setIsPopoverOpen(true);
      setContentLoaded(false);
    }
  }, [popoverState?.position]);

  useEffect(() => {
    if (!isPopoverOpen || !contentRef.current) return;

    const images = contentRef.current.querySelectorAll('img');
    if (images.length === 0) {
      setContentLoaded(true);
      return;
    }

    let loadedImages = 0;
    const totalImages = images.length;

    const handleImageLoad = () => {
      loadedImages += 1;
      if (loadedImages === totalImages) {
        setContentLoaded(true);
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad); 
      }
    });

    return () => {
      images.forEach((img) => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [isPopoverOpen, popoverState?.bodyAsHtml]);

  useEffect(() => {
    if (isPopoverOpen && popoverRef.current && isGlossary && contentLoaded) {
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const newPosition = { ...position };
      let needsUpdate = false;

      if (newPosition.x + popoverRect.width > viewportWidth - 20) {
        newPosition.x = Math.max(20, viewportWidth - popoverRect.width - 20);
        needsUpdate = true;
      }

      if (popoverState?.triggerRef?.current) {
        const triggerRect = popoverState.triggerRef.current.getBoundingClientRect();
        const idealY = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;

        if (Math.abs(idealY - newPosition.y) > 10) {
          newPosition.y = idealY;
          needsUpdate = true;
        }
      }

      if (newPosition.y + popoverRect.height > viewportHeight - 20) {
        newPosition.y = Math.max(20, viewportHeight - popoverRect.height - 20);
        needsUpdate = true;
      }

      if (newPosition.y < 20) {
        newPosition.y = 20;
        needsUpdate = true;
      }

      if (needsUpdate) {
        setPosition(newPosition);
      }
    }
  }, [isPopoverOpen, isGlossary, position, popoverState?.triggerRef, contentLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (isPopoverOpen && popoverRef.current) {
        const popoverRect = popoverRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const newPosition = { ...position };
        let needsUpdate = false;

        if (newPosition.x + popoverRect.width > viewportWidth - 20) {
          newPosition.x = Math.max(20, viewportWidth - popoverRect.width - 20);
          needsUpdate = true;
        }

        if (newPosition.y + popoverRect.height > viewportHeight - 20) {
          newPosition.y = Math.max(20, viewportHeight - popoverRect.height - 20);
          needsUpdate = true;
        }

        if (newPosition.y < 20) {
          newPosition.y = 20;
          needsUpdate = true;
        }

        if (needsUpdate) {
          setPosition(newPosition);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPopoverOpen, position]);

  const handleClose = useCallback(() => {
    setTimeout(() => {
      if (popoverState?.triggerRef?.current) {
        popoverState.triggerRef.current.focus();
      }
    }, POPOVER_CONSTANTS.FOCUS_DELAY);
    setPopoverState(null);
    setIsPopoverOpen(false);
  }, [popoverState?.triggerRef, setPopoverState]);

  const handleKeyboardNavigation = (e: React.KeyboardEvent) => {
    const scrollContainer = e.currentTarget.parentElement;
    if (scrollContainer) {
      const scrollAmount = POPOVER_CONSTANTS.SCROLL.AMOUNT;

      switch (e.key) {
        case KeyboardKeys.ARROW_DOWN:
          scrollContainer.scrollTop += scrollAmount;
          e.preventDefault();
          break;
        case KeyboardKeys.ARROW_UP:
          scrollContainer.scrollTop -= scrollAmount;
          e.preventDefault();
          break;
        case KeyboardKeys.PAGE_DOWN:
          scrollContainer.scrollTop += scrollContainer.clientHeight;
          e.preventDefault();
          break;
        case KeyboardKeys.PAGE_UP:
          scrollContainer.scrollTop -= scrollContainer.clientHeight;
          e.preventDefault();
          break;
        case KeyboardKeys.HOME:
          scrollContainer.scrollTop = 0;
          e.preventDefault();
          break;
        case KeyboardKeys.END:
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          e.preventDefault();
          break;
      }
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === KeyboardKeys.ESCAPE && popoverState) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [popoverState, handleClose]);

  if (!popoverState) return null;

  const { heading, body, bodyAsHtml, accentColor } = popoverState;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !popoverRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const clamp = (value: number, minValue: number, maxValue: number) => Math.min(Math.max(value, minValue), maxValue);

    setPosition({
      x: clamp(clientX - dragOffset.x, 0, viewportWidth - popoverRect.width),
      y: clamp(clientY - dragOffset.y, 0, viewportHeight - popoverRect.height),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOutsideClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    handleClose();
  };

  return (
    <>
      <MathJax inline dynamic>
        <div
          className="absolute top-0 left-0 w-screen h-screen"
          onClick={handleOutsideClick}
          role="presentation"
        ></div>
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: isZoomed200 ? '30%' : `${position.y}px`,
              left: isZoomed200 ? '5vw' : `${position.x}px`,
              zIndex: 50,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className={isGlossary ? 'glossary-popover' : 'help-info-popover'}
          >
            <div
              className="overflow-hidden bg-white rounded-xl shadow-lg border-2 border-solid text-xl font-medium"
              style={{
                borderColor: accentColor,
                maxWidth: '90vw',
                width: popoverState.customStyle
                  ? popoverState.customStyle?.width
                  : `${window.innerWidth - position.x - 79}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="overflow-y-auto p-6 pt-8 pr-8"
                style={{
                  maxHeight: isGlossary ? '85vh' : '87vh',
                }}
              >
                <button
                  className="absolute top-3 right-3 rounded-full"
                  aria-label={t('popover.close')}
                  onClick={handleClose}
                  onKeyDown={handleKeyboardNavigation}
                  autoFocus
                >
                  <CloseIcon />
                </button>
                {heading && (
                  <h2
                    id="popover-heading"
                    className="text-2xl font-bold mb-4 leading-10"
                    style={{ color: accentColor }}
                  >
                    {t(heading)}
                  </h2>
                )}
                {body ? (
                  <div className="body-content" ref={contentRef}>
                    {t(body)}
                  </div>
                ) : (
                  <div className="body-content" ref={contentRef}>
                    {parse(t(bodyAsHtml || ''))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </MathJax>
    </>
  );
};

export default Popover;
