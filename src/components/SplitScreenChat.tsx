import React, { useMemo, useRef } from 'react';
import { LeftDialogPaddingOverrideType, SceneDataProps } from '../types/interfaces';
import Dialog from './Dialog/Dialog';
import './SplitScreenChat.css';
import { DialogSizeType, DURATIONS, POSITION } from '../constants/constants';
import { useTranslations } from '../hooks/useTranslations';
import useScreenSize from '../hooks/useScreenSize';

const SplitScreenChat: React.FC<SceneDataProps> = ({ currentScene, onNext, onBack, dialogIndex, sceneIndex }) => {
  const { t } = useTranslations();
  const rightRef = useRef<HTMLDivElement>(null);
  const { isZoomed200, isVerticalScreen } = useScreenSize();

  const visibleDialogs = useMemo(() => {
    const allDialogs = [];
    let currentIndex = 0;

    for (let i = 0; i < (currentScene.dialogs ?? []).length && currentIndex <= dialogIndex; i++) {
      const dialog = currentScene.dialogs?.[i];
      allDialogs.push({
        side: dialog?.side || POSITION.RIGHT,
        dialog,
        index: currentIndex++,
      });
    }

    const filteredDialogs = allDialogs.reduce(
      (result, dialog) => {
        if (dialog.dialog?.discardPrevious) {
          result[dialog.side] = [dialog];
        } else {
          result[dialog.side] = [...(result[dialog.side] || []), dialog];
        }
        return result;
      },
      {} as Record<string, typeof allDialogs>,
    );

    return Object.values(filteredDialogs).flat();
  }, [currentScene, dialogIndex]);

  const leftDialogs = visibleDialogs.filter((item) => item.side === POSITION.LEFT);
  const rightDialogs = visibleDialogs.filter((item) => item.side === POSITION.RIGHT);

  const handleDialogHeightChange = () => {
    setTimeout(() => {
      if (rightRef.current) {
        rightRef.current.scrollTop = rightRef.current.scrollHeight;
      }
    }, DURATIONS.heightTransition);
  };

  const leftDialogPaddingOverride: LeftDialogPaddingOverrideType = {
    container: {
      padding: '2rem 1rem',
    },
    header: {
      padding: '0 0.25rem',
    },
    body: {
      padding: '0 0.25rem',
      overflowY: 'hidden',
    },
  };

  return (
    <div className="fixed inset-0 w-full h-full">
      <div className={`flex h-full flex-col md:flex-row overflow-y-auto ${isZoomed200 ? 'py-12' : ''}`}>
        <div
          className={`w-full ${isVerticalScreen ? 'md:w-[50%]' : 'md:w-[57.58%]'} h-1/2 md:h-full ${
            isZoomed200 ? 'h-auto' : ''
          }`}
          role="region"
          aria-label={t('scenes.common.left-side')}
        >
          <div className="h-full w-full relative flex flex-col overflow-y-hidden">
            <div className={`flex flex-col min-h-full h-[inherit] items-center `}>
              {leftDialogs.map((item, index) => (
                <Dialog
                  key={`left-${sceneIndex}-${index}`}
                  dialogIndex={index}
                  dialogKey={`left-${sceneIndex}-${index}`}
                  {...item.dialog}
                  onNext={item.index === dialogIndex ? onNext : undefined}
                  onBack={item.index === dialogIndex ? onBack : undefined}
                  onHeightChange={handleDialogHeightChange}
                  width="100%"
                  dialogSizeType={DialogSizeType.FULL}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className={`w-full  ${isVerticalScreen ? 'md:w-[50%]' : 'md:w-[42.42%]'} h-1/2 md:h-full ${
            isZoomed200 ? 'h-auto' : ''
          }`}
          role="region"
          aria-label={t('scenes.common.right-side')}
        >
          <div
            ref={rightRef}
            className={`flex flex-col justify-end h-full ${
              isZoomed200 ? 'overflow-hidden h-auto' : 'overflow-y-auto'
            } box-border`}
          >
            <div
              className={`flex flex-col gap-5 items-center ${!isVerticalScreen && !isZoomed200 ? 'p-0 pr-20 pb-14 pl-4' : 'p-8'}`}
            >
              {rightDialogs.map((item, index) => (
                <Dialog
                  key={`right-${sceneIndex}-${index}`}
                  dialogKey={`right-${sceneIndex}-${index}`}
                  dialogIndex={index + leftDialogs.length}
                  {...item.dialog}
                  onNext={item.index === dialogIndex ? onNext : undefined}
                  onBack={item.index === dialogIndex ? onBack : undefined}
                  onHeightChange={handleDialogHeightChange}
                  leftDialogPaddingOverride={leftDialogPaddingOverride}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitScreenChat;
