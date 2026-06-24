import { MathJax } from 'better-react-mathjax';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DialogSizeType, DURATIONS } from '../../constants/constants';
import { useGameContext } from '../../hooks/useGameContext';
import { useNavigateDialog } from '../../hooks/useNavigateDialog';
import { DialogProps, InteractionState, NavigationControlsRef } from '../../types/interfaces';
import NavigationControls from '../NavigationControls';
import './Dialog.css';
import DialogBody from './DialogBody';
import DialogHeader from './DialogHeader';
import DialogInteractions from './DialogInteractions';
import { createStyles } from './styles';

const Dialog: React.FC<DialogProps> = ({
  dialogIndex,
  heading,
  body,
  bodyAsHtml,
  backgroundColor = '#fff',
  width = 'auto',
  headingColor = '#AF52DE',
  onBack,
  onNext,
  avatar,
  controls,
  about,
  help,
  glossary,
  interactions,
  buttonAlignment,
  onHeightChange,
  dialogSizeType,
  isPrimaryHeading,
  events,
  leftDialogPaddingOverride,
  contentBackgroundColor,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyWrapperRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const {
    responses,
    setResponses,
    currentSceneIndex,
    dialogIndex: currentDialogIndex,
    setInteractiveResponses,
  } = useGameContext();
  const [localInteractionStates, setLocalInteractionStates] = useState<InteractionState[]>([]);
  const navigationControlsRef = useRef<NavigationControlsRef>(null);
  const bodyAsHtmlRef = useRef(bodyAsHtml);
  const isStyled = useRef(false);
  const [isSubmitTriggered, setIsSubmitTriggered] = useState(false);

  const { handleNavigate, applyButtonStyles } = useNavigateDialog();

  const styles = useMemo(
    () => createStyles(backgroundColor, width, headingColor, DURATIONS, contentBackgroundColor),
    [backgroundColor, width, headingColor, contentBackgroundColor],
  );

  // Force GIF reload when dialog changes
  useEffect(() => {
    const reloadGifs = () => {
      if (!dialogRef.current) return;
      
      const gifs = dialogRef.current.querySelectorAll<HTMLImageElement>('img[src*=".gif"]');
      gifs.forEach((gif) => {
        const originalSrc = gif.src.split('?')[0]; // Remove existing cache buster
        gif.src = `${originalSrc}?t=${Date.now()}`; // Add timestamp to force reload
      });
    };

    // Small delay to ensure DOM is ready
    const timeoutId = window.setTimeout(reloadGifs, 50);

    return () => clearTimeout(timeoutId);
  }, [dialogIndex, currentDialogIndex, currentSceneIndex]);

  useEffect(() => {
    return () => {
      bodyAsHtmlRef.current = undefined;
      isStyled.current = false;
    };
  }, [onHeightChange]);

  const clickHandler = useCallback(
    (e: Event) => {
      const destination = (e.currentTarget as HTMLButtonElement).dataset.destination;
      if (destination) {
        handleNavigate(destination);
      }
    },
    [handleNavigate],
  );

  useEffect(() => {
    let timeoutId: number;
    const dialogCurrent = dialogRef.current;

    if (bodyAsHtmlRef.current === bodyAsHtml && isStyled.current) {
      return;
    }
    bodyAsHtmlRef.current = bodyAsHtml;

    const applyStylesAndListeners = () => {
      if (!dialogCurrent) return false;
      const buttons = dialogCurrent.querySelectorAll<HTMLButtonElement>('button[data-destination]');
      if (buttons.length === 0) return false;

      buttons.forEach((button) => {
        applyButtonStyles(button);
        button.addEventListener('click', clickHandler);
      });
      isStyled.current = true;
      return true;
    };

    const success = applyStylesAndListeners();

    if (!success) {
      timeoutId = window.setTimeout(() => {
        applyStylesAndListeners();
      }, 300);
    }

    return () => {
      clearTimeout(timeoutId);
      if (dialogCurrent) {
        const buttons = dialogCurrent.querySelectorAll<HTMLButtonElement>('button[data-destination]');
        buttons.forEach((button) => {
          button.removeEventListener('click', clickHandler);
        });
      }
    };
  }, [applyButtonStyles, bodyAsHtml, clickHandler]);

  const getResponseId = useCallback(
    (interactionIndex: number) => {
      return `${currentSceneIndex}_${dialogIndex ?? currentDialogIndex}_${interactionIndex}`;
    },
    [currentSceneIndex, dialogIndex, currentDialogIndex],
  );

  const handleInteraction = useCallback(
    (interactionIndex: number, state: InteractionState | Record<string, string | number | boolean | null>) => {
      if (interactions?.[interactionIndex]?.enableStateExchange) {
        const prefix = `${currentSceneIndex}_${dialogIndex}`;
        setInteractiveResponses((prevResponses) => {
          const existingState = prevResponses[prefix] || {};
          const updatedState = { ...existingState };
          let shouldUpdate = false;

          Object.entries(state).forEach(([key, value]) => {
            if (existingState[key] === undefined || existingState[key] !== value) {
              updatedState[key] = value;
              shouldUpdate = true;
            }
          });

          if (!shouldUpdate) return prevResponses;
          return {
            ...prevResponses,
            [prefix]: updatedState,
          };
        });
      } else {
        setLocalInteractionStates((prevStates) => {
          const newStates = [...prevStates];
          newStates[interactionIndex] = state;
          return newStates;
        });
      }
    },
    [],
  );

  const handleOnSubmit = useCallback(() => {
    navigationControlsRef.current?.handleExplicitSubmit();
  }, []);

  const handleNext = useCallback(() => {
    localInteractionStates.forEach((state, index) => {
      const responseId = getResponseId(index);
      setResponses((prevResponses) => {
        const existingResponse = prevResponses.find((response) => response.id === responseId);
        const shouldMarkSubmitted = state.isCorrect && !state.isEmpty;

        if (existingResponse) {
          return prevResponses.map((response) =>
            response.id === responseId ? { ...response, state, isSubmitted: shouldMarkSubmitted } : response,
          );
        }
        return [
          ...prevResponses,
          {
            id: responseId,
            state,
            isSubmitted: shouldMarkSubmitted,
          },
        ];
      });
    });
    onNext?.();
  }, [localInteractionStates, getResponseId, setResponses, onNext]);

  const [savedInteractionStates, isSubmitted] = useMemo(() => {
    if (!interactions?.length) return [[], false];
    const prefix = `${currentSceneIndex}_${dialogIndex ?? currentDialogIndex}`;
    const states: InteractionState[] = [];
    let allSubmitted = true;

    interactions.forEach((_, index) => {
      const response = responses.find((r) => r.id === `${prefix}_${index}`);
      if (response) {
        states[index] = response.state;
        if (!response.isSubmitted) {
          allSubmitted = false;
        }
      } else {
        allSubmitted = false;
      }
    });

    return [states, allSubmitted];
  }, [responses, currentSceneIndex, dialogIndex, currentDialogIndex, interactions]);

  const handleDialogHeight = useCallback(() => {
    const bodyWrapperRefCurrent = bodyWrapperRef.current;
    const bodyRefCurrent = bodyRef.current;
    if (bodyWrapperRefCurrent && bodyRefCurrent && dialogSizeType !== DialogSizeType.FULL) {
      bodyWrapperRefCurrent.style.height = `${bodyRefCurrent.scrollHeight}px`;

      requestAnimationFrame(() => {
        if (bodyRefCurrent) {
          const newBodyHeight = bodyRefCurrent.scrollHeight;
          bodyWrapperRefCurrent.style.height = `${newBodyHeight}px`;
        }
        onHeightChange?.();
      });
    }
  }, [onHeightChange, dialogSizeType]);

  useEffect(() => {
    let resizeObserver: ResizeObserver;
    const bodyRefCurrent = bodyRef.current;
    if (bodyRefCurrent) {
      resizeObserver = new ResizeObserver(() => {
        handleDialogHeight();
      });
      resizeObserver.observe(bodyRefCurrent);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [dialogIndex, currentSceneIndex, handleDialogHeight, onHeightChange]);

  return (
    <div
      className="dialog ease-in w-full md:w-auto xl:min-w-[500px] flex flex-col"
      ref={dialogRef}
      style={
        dialogSizeType === DialogSizeType.FULL
          ? styles.full.mainContainer
          : {
              ...styles.container,
              ...(leftDialogPaddingOverride?.container || {}),
            }
      }
      role="region"
    >
      <MathJax dynamic style={dialogSizeType === DialogSizeType.FULL ? styles.full.innerContainer : {}}>
        {heading && (
          <DialogHeader
            heading={heading}
            avatar={avatar}
            help={help}
            about={about}
            styles={{
              ...styles,
              ...styles.full.heading,
              ...(leftDialogPaddingOverride?.header || {}),
            }}
            dialogSizeType={dialogSizeType}
            isPrimaryHeading={isPrimaryHeading}
          />
        )}
        <div
          className="body-and-interactions mb-5"
          ref={bodyWrapperRef}
          style={{
            ...(dialogIndex && dialogIndex !== currentDialogIndex ? {} : styles.body),
            ...(dialogSizeType === DialogSizeType.FULL
              ? styles.full.body
              : leftDialogPaddingOverride?.body || { overflow: 'hidden' }),
          }}
        >
          <div ref={bodyRef}>
            <DialogBody body={body} bodyAsHtml={bodyAsHtml} glossary={glossary} dialogRef={dialogRef} />
            <DialogInteractions
              interactions={interactions}
              interactionStates={savedInteractionStates}
              getResponseId={getResponseId}
              handleInteraction={handleInteraction}
              handleSubmit={handleOnSubmit}
              isSubmitTriggered={isSubmitTriggered}
            />
          </div>
        </div>
        {(onBack || onNext) && (
          <NavigationControls
            key={dialogIndex}
            ref={navigationControlsRef}
            onBack={onBack}
            onNext={handleNext}
            controls={controls}
            isSubmitted={isSubmitted}
            interactionStates={interactions?.length ? localInteractionStates : null}
            buttonAlignment={buttonAlignment}
            dialogSizeType={dialogSizeType}
            styles={styles}
            setIsSubmitTriggered={setIsSubmitTriggered}
            events={events}
          />
        )}
      </MathJax>
    </div>
  );
};

export default Dialog;
