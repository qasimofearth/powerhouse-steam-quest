import { useCallback, useEffect, useMemo, useState, memo, forwardRef, useImperativeHandle, Fragment } from 'react';
import { useGameContext } from '../hooks/useGameContext';
import {
  DialogControls,
  DialogControlTypes,
  NavigationControlsProps,
  NavigationControlsRef,
  SceneEvent,
} from '../types/interfaces';
import { useTranslations } from '../hooks/useTranslations';
import { BUTTON_STYLES, DialogSizeType, Direction, POSITION } from '../constants/constants';
import './NavigationControl.css';
import { useSilentAudio } from '../hooks/useSilentAudio';
import { EventBus } from '../services/EventBus';

const NavigationControls = memo(
  forwardRef<NavigationControlsRef, NavigationControlsProps>(
    (
      {
        onBack,
        onNext,
        backDisabled = false,
        nextDisabled = false,
        controls = [
          { type: Direction.BACK, text: 'dialog.button.back' },
          { type: Direction.NEXT, text: 'dialog.button.next' },
        ] as DialogControls[],
        interactionStates = [],
        buttonAlignment = POSITION.RIGHT,
        isSubmitted = false,
        dialogSizeType,
        styles,
        setIsSubmitTriggered,
        events,
      },
      ref,
    ) => {
      const { t } = useTranslations();
      // If this dialog declares an on-next "disabled" gate config, the Next
      // button must START disabled (synchronously) — otherwise a fast click can
      // slip through before the async gate-config import resolves.
      const hasNextGate = useMemo(
        () =>
          Array.isArray(events) &&
          events.some(
            (e) => e?.triggers?.includes('on-next') && typeof e?.payload?.disabled === 'string',
          ),
        [events],
      );
      const [hasAttempted, setHasAttempted] = useState(false);
      const [showCorrect, setShowCorrect] = useState(false);
      const [isNextDisabled, setIsNextDisabled] = useState<boolean>(hasNextGate);
      const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
      const { interactiveResponses } = useGameContext();
      const { playSilentAudio } = useSilentAudio();

      const emitEvents = useCallback(
        (trigger: SceneEvent['triggers'][number]) => {
          events?.forEach((event) => {
            if (event.triggers.includes(trigger)) {
              EventBus.emit(event.payload.target, event.payload);
            }
          });
        },
        [events],
      );

      const proceedToNext = useCallback(() => {
        emitEvents('on-next');
        onNext?.();
        return;
      }, [onNext, emitEvents]);

      const handleNext = useCallback(() => {
        if (isSubmitted) {
          return proceedToNext();
        }
        setHasAttempted(true);
        if (!interactionStates) {
          return proceedToNext();
        }

        const hasInteractions = interactionStates.length > 0;
        const allCorrect = hasInteractions && interactionStates.every((state) => state?.isCorrect);

        if (!hasInteractions) {
          return proceedToNext();
        }

        if (allCorrect) {
          setShowCorrect(true);
          setIsSubmitTriggered(true);
          const handleAnimationComplete = () => {
            setShowCorrect(false);
            proceedToNext();
          };

          playSilentAudio(1500, handleAnimationComplete);
        }
      }, [interactionStates, proceedToNext, isSubmitted, setIsSubmitTriggered, playSilentAudio]);

      const handleClick = useCallback(
        (action: DialogControlTypes) => {
          if (showCorrect) return () => {};
          if (action === Direction.BACK) {
            emitEvents('on-back');
            return onBack;
          }
          return handleNext;
        },
        [onBack, handleNext, emitEvents],
      );

      useEffect(() => {
        if (interactionStates && interactionStates.length > 0) {
          setHasAttempted(false);
        }
      }, [interactionStates]);

      useEffect(() => {
        if (nextDisabled) {
          setIsNextDisabled(true);
        } else if (interactionStates) {
          setIsSubmitDisabled(
            !interactionStates
              ? false
              : interactionStates.length > 0
                ? interactionStates.some((state) => state?.isEmpty)
                : true,
          );
        }
        return () => {
          if (!hasNextGate) setIsNextDisabled(false);
          setIsSubmitDisabled(false);
        };
      }, [interactionStates, nextDisabled, hasNextGate]);

      const handleExplicitSubmit = useCallback(() => {
        if (!isSubmitDisabled) {
          handleNext();
        }
      }, [handleNext, isSubmitDisabled]);

      useImperativeHandle(ref, () => ({
        handleExplicitSubmit,
      }));

      const controlsMap = useMemo(
        () =>
          controls.reduce<Record<DialogControlTypes, DialogControls>>(
            (acc, control) => ({ ...acc, [control.type]: control }),
            {} as Record<DialogControlTypes, DialogControls>,
          ),
        [controls],
      );

      const buttonConfigs = useMemo(
        () => ({
          back: {
            disabled: backDisabled,
            className: backDisabled
              ? BUTTON_STYLES.classes.secondary.disabled
              : BUTTON_STYLES.classes.secondary.enabled,
          },
          next: {
            disabled: isNextDisabled,
            className: isNextDisabled
              ? BUTTON_STYLES.classes.primary.disabled
              : BUTTON_STYLES.classes.primary.enabled,
          },
          start: {
            disabled: isNextDisabled,
            className: isNextDisabled ? BUTTON_STYLES.classes.start.disabled : BUTTON_STYLES.classes.start.enabled,
          },
          submit: {
            disabled: isSubmitDisabled,
            className: isSubmitDisabled
              ? BUTTON_STYLES.classes.primary.disabled
              : BUTTON_STYLES.classes.primary.enabled,
          },
        }),
        [backDisabled, isSubmitDisabled, isNextDisabled],
      );

      const getButtonText = (type: string, control: DialogControls) => {
        if (interactionStates && interactionStates.length > 0 && type === 'submit') {
          if (isSubmitted) {
            return t('dialog.button.next');
          }
          if (hasAttempted && !showCorrect) {
            return t('dialog.button.try-again');
          }
          if (showCorrect) {
            return t('dialog.button.correct');
          }
        }
        return t(control.text ?? '');
      };

      useEffect(() => {
        if (!interactiveResponses || !events) return;
        let isSubscribed = true;
        const checkOverrides = async () => {
          for (const event of events) {
            if (!isSubscribed) break; // Stop if component unmounted

            if (event.triggers.includes('on-next') && event.payload?.disabled) {
              try {
                if (typeof event.payload?.disabled === 'string') {
                  const gameId = import.meta.env.VITE_GAME_ID;
                  const module = await import(`../GAME_DATA/${gameId}/configs/${event.payload?.disabled}.ts`);
                  const overrideFunction = module.default;
                  if (isSubscribed) {
                    setIsNextDisabled(overrideFunction(interactiveResponses));
                  }
                } else {
                  // Handle legacy direct function case
                  const overrideDisabled =
                    typeof event.payload?.disabled === 'function'
                      ? event.payload?.disabled(interactiveResponses)
                      : (event.payload?.disabled ?? true);
                  if (isSubscribed) {
                    setIsNextDisabled(overrideDisabled as boolean);
                  }
                }
              } catch (error) {
                console.error('Error loading override function:', error);
                if (isSubscribed) {
                  setIsNextDisabled(true);
                }
              }
            }
          }
        };

        checkOverrides();

        return () => {
          isSubscribed = false; // Cleanup to prevent setting state after unmount
        };
      }, [interactiveResponses, events]);

      return (
        <div
          className="flex space-x-[0.625rem]"
          style={{
            justifyContent: buttonAlignment === POSITION.RIGHT ? 'flex-end' : 'flex-start',
            ...(dialogSizeType === DialogSizeType.FULL ? styles.full.navigation : {}),
          }}
        >
          {Object.entries(controlsMap).map(([type, control]) => {
            const config = buttonConfigs[type as DialogControlTypes];
            if (!config) return null;

            const shouldShake =
              interactionStates &&
              interactionStates.length > 0 &&
              type === 'submit' &&
              hasAttempted &&
              (!interactionStates.every((state) => state?.isCorrect || false) ||
                interactionStates.some((state) => state?.isEmpty || false));

            const buttonClasses = `
                        ${BUTTON_STYLES.classes.common}
                        ${
                          shouldShake
                            ? 'bg-[#A6001A] hover:bg-[#8C0016] text-white'
                            : showCorrect && type === 'submit'
                              ? 'bg-[#005F20] hover:bg-[#004D19] text-white animate-[bounce_1s_ease-in-out_1]'
                              : config.className
                        }
                        ${shouldShake ? 'animate-[tilt-shaking_0.5s_ease-in-out_1]' : ''}
                    `;

            return (
              <Fragment key={type}>
                <button
                  autoFocus
                  onClick={handleClick(control.type)}
                  disabled={config.disabled}
                  style={BUTTON_STYLES.base}
                  className={buttonClasses}
                  aria-label={type === 'submit' ? t('dialog.button.submit') : t(control.text ?? '')}
                >
                  {getButtonText(type, control)}
                </button>
                {type === 'submit' && (
                  <span aria-live="off" className="sr-only">
                    {getButtonText(type, control)}
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
      );
    },
  ),
);

NavigationControls.displayName = 'NavigationControls';

export default NavigationControls;
