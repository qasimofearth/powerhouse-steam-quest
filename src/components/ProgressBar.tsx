import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { SceneData } from '../types/interfaces';
import { useSceneTransitionContext } from '../hooks/useSceneTransitionContext';
import CustomTooltip from './CustomTooltip';
import {
  Direction,
  ENTER_KEY,
  MAX_POPOVER_WIDTH,
  POPOVER_ARROW_WIDTH,
  SPACEBAR_KEY,
} from '../constants/constants';
import { useSceneTransition } from '../hooks/useSceneTransition';
import { useBranchState } from '../hooks/useBranchState';
import { isAppleMobileOS } from '../utils/detectAppleMobileOS';

interface ProgressBarProps {
  isVisible: boolean;
  scenes: SceneData[];
  currentSceneIndex: number;
  currentSceneDialogIndex: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  scenes,
  isVisible,
  currentSceneIndex,
  currentSceneDialogIndex,
}) => {
  const { t } = useTranslations();
  const [maxProgress, setMaxProgress] = useState({
    sceneIndex: 0,
    dialogIndex: 0,
  });
  const { handleExactSceneTransition } = useSceneTransitionContext();
  const [, setIsTransitioningForward] = useState(true);
  const branchState = useBranchState(scenes);
  const { findNextValidDialog } = useSceneTransition(scenes, setIsTransitioningForward, branchState);
  const [tooltipInfo, setTooltipInfo] = useState<{ visible: boolean; index: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<
    Map<number, { left: number; visible: boolean; width: number }>
  >(new Map());
  const isAppleMobileOSDevice = useMemo(() => isAppleMobileOS(), []);

  // Update max progress whenever we move forward
  useEffect(() => {
    setMaxProgress((previousMaxProgress) => {
      if (currentSceneIndex > previousMaxProgress.sceneIndex) {
        return {
          sceneIndex: currentSceneIndex,
          dialogIndex: currentSceneDialogIndex,
        };
      } else if (
        currentSceneIndex === previousMaxProgress.sceneIndex &&
        currentSceneDialogIndex > previousMaxProgress.dialogIndex
      ) {
        return {
          ...previousMaxProgress,
          dialogIndex: currentSceneDialogIndex,
        };
      } else {
        return previousMaxProgress;
      }
    });
  }, [currentSceneIndex, currentSceneDialogIndex]);

  if (!isVisible) return null;

  const ariaLabel = `${t('scenes.common.quest_progress')}: ${((maxProgress.dialogIndex / scenes.reduce((acc, scene) => acc + scene.dialogs.length, 0)) * 100).toFixed(2)}%`; // TODO: Update the label

  const dialogsInSceneData = scenes.reduce((acc, scene) => acc + scene.dialogs.length, 0);
  const handleClick = (index: number) => {
    if (index <= maxProgress.sceneIndex || index === currentSceneIndex) {
      // Logic to navigate to the clicked scene
      handleExactSceneTransition({
        nextSceneIndex: index,
        nextDialogIndex:
          index === maxProgress.sceneIndex
            ? (maxProgress.dialogIndex || 0) - 1
            : findNextValidDialog(index, 0, Direction.NEXT)?.dialogIndex,
      });
    }
    setTooltipInfo(null);
  };

  const handleClickTooltip = (index: number) => {
    if (index == tooltipInfo?.index) {
      setTooltipInfo(null);
      return;
    }
    if (index > maxProgress.sceneIndex) {
      return;
    }

    const element = document
      .querySelector(`[data-key="${t(scenes[index].name as string)}"]`)
      ?.getBoundingClientRect() || { left: 0, right: 0 };
    const progressBarStart = element.left; // Start position
    const progressBarEnd = element.right; // End position
    let centerPosition = progressBarStart + (progressBarEnd - progressBarStart) / 2; // Calculate center position
    centerPosition -= POPOVER_ARROW_WIDTH;

    let finalPosition = centerPosition;
    if (centerPosition - MAX_POPOVER_WIDTH / 2 < 0) {
      finalPosition = 0;
    } else if (centerPosition + MAX_POPOVER_WIDTH > window.innerWidth) {
      finalPosition = window.innerWidth - MAX_POPOVER_WIDTH;
    } else {
      finalPosition = centerPosition - MAX_POPOVER_WIDTH / 2;
    }

    const localTooltipPositionMap = new Map(tooltipPosition);
    localTooltipPositionMap.set(index, {
      left: finalPosition,
      width: centerPosition,
      visible: true,
    });
    setTooltipPosition(localTooltipPositionMap);
    setTooltipInfo({ index: index, visible: true });
  };

  return (
    <>
      <div
        role="region"
        aria-label={ariaLabel}
        className="absolute bottom-0 left-0 right-0"
      >
        <div className="w-full h-full bg-black pt-[3px] pb-[3px] flex" role="region" aria-label={ariaLabel}>
          {scenes.map((scene, index) => {
            const totalDialogs = scene.dialogs.length;
            const isCompleted =
              index < maxProgress.sceneIndex ||
              (index === maxProgress.sceneIndex && maxProgress.dialogIndex === totalDialogs);
            const isCurrent = index === maxProgress.sceneIndex;

            return (
              <div
                key={index}
                className={`relative ${isAppleMobileOSDevice ? 'h-4' : 'h-2'}`}
                data-key={t(scene.name as string)}
                style={{
                  width: `${(totalDialogs / dialogsInSceneData) * 100}%`,
                  backgroundColor: '#D9D9D9',
                  marginRight: '2.5px',
                  marginLeft: '2.5px',
                  cursor: isCompleted || isCurrent ? 'pointer' : 'default',
                }}
                onClick={() => handleClickTooltip(index)}
                onKeyDown={(event) => {
                  if (event.key === ENTER_KEY || event.key === SPACEBAR_KEY) {
                    event.preventDefault();
                    handleClickTooltip(index);
                  }
                }}
                aria-label={t(scene.name as string)}
                role="button"
                tabIndex={isCompleted || isCurrent ? 0 : -1}
                aria-disabled={!(isCompleted || isCurrent)}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${
                      index < maxProgress.sceneIndex
                        ? 100
                        : index === maxProgress.sceneIndex
                          ? (maxProgress.dialogIndex / totalDialogs) * 100
                          : 0
                    }%`,
                    backgroundColor: '#007AFF',
                  }}
                />
              </div>
            );
          })}
          {tooltipInfo && tooltipInfo?.visible && (
            <CustomTooltip
              scenes={scenes}
              tooltipInfo={tooltipInfo}
              handleClick={handleClick}
              popOverPosition={tooltipPosition}
              setTooltipInfo={setTooltipInfo}
            ></CustomTooltip>
          )}
        </div>
      </div>
    </>
  );
};

export default ProgressBar;
