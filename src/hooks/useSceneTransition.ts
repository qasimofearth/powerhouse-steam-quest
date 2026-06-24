import { useCallback, useEffect, useRef, useMemo } from 'react';
import { SceneData, SceneTransitionOptions, BranchState } from '../types/interfaces';
import { useGameContext } from './useGameContext';
import { useScormContext } from './useScormContext';
import { Direction } from '../constants/constants';

export const useSceneTransition = (
  sceneData: SceneData[],
  setIsTransitioningForward: React.Dispatch<React.SetStateAction<boolean>>,
  branchState: BranchState,
) => {
  const { currentSceneIndex, setCurrentSceneIndex, dialogIndex, setDialogIndex, setSceneProgressCount, setShowContent } =
    useGameContext();
  const { setStatus, setScore, setLocation } = useScormContext();
  const {
    resetBranchState,
    isEndOfBranch,
    completeBranch,
    getNextBranch,
    getHighestEndPath,
    getBranch,
    getOtherBranchesSceneCount,
    getBranchMap
  } = branchState;
  const prevSceneIndex = useRef(currentSceneIndex);
  const navigationHistory = useRef<Array<{ sceneIndex: number; dialogIndex: number; skippedScenes?: number }>>([]);
  const progressSteps = useRef<number>(1);
  const maxSteps = sceneData.length;
  /**
   * Branch state only exists when choice screen is enabled. Current implementation only works for 
   * either Choice Screen or New Progressbar navigation. This function is acting like a switch as of now.
   * TODO: 'If choice screen is also required along with New progressbar then we need to change 
   * the navigation logic otherwise, the overall navigation of quest would not work as expected.'
   */
  const hasChoiceScreen = useMemo(() => (Object.keys(getBranchMap() || {}).length !== 0), [getBranchMap]);
  /**
   * When the Scene Type is changed, we need to set the showContent flag to false to avoid the blink effect due to wait delay in next scene.
   */
  const  hasSameSceneType = useRef(false);

  const updateProgress = useCallback(
    (direction: Direction.NEXT | Direction.BACK, stepCount: number = 1) => {
      if (progressSteps.current === maxSteps + 1) {
        progressSteps.current = 1;
      }

      if (direction === Direction.NEXT) {
        progressSteps.current = progressSteps.current + stepCount;
      } else if (direction === Direction.BACK) {
        progressSteps.current = progressSteps.current - stepCount;
      }

      const progress = Math.round((progressSteps.current / maxSteps) * 100);

      setSceneProgressCount(progress);
    },
    [maxSteps, setSceneProgressCount],
  );

  useEffect(() => {
    if (currentSceneIndex > prevSceneIndex.current) {
      setIsTransitioningForward(true);
    } else if (currentSceneIndex < prevSceneIndex.current) {
      setIsTransitioningForward(false);
    }
    prevSceneIndex.current = currentSceneIndex;
    setLocation(`${currentSceneIndex}`);
  }, [currentSceneIndex, setIsTransitioningForward, setLocation]);

  const findNextValidDialog = useCallback(
    (
      sceneIndex: number,
      startDialogIndex: number,
      direction: Direction.NEXT | Direction.BACK,
    ): { sceneIndex: number; dialogIndex: number } | null => {
      let currentSceneIdx = sceneIndex;
      let currentDialogIdx = startDialogIndex;

      while (currentSceneIdx >= 0 && currentSceneIdx < sceneData.length) {
        const scene = sceneData[currentSceneIdx];
        const dialogs = scene.dialogs;

        while (direction === Direction.NEXT ? currentDialogIdx < dialogs.length : currentDialogIdx >= 0) {
          if (!dialogs[currentDialogIdx].skipNavigation) {
            return { sceneIndex: currentSceneIdx, dialogIndex: currentDialogIdx };
          }
          currentDialogIdx += direction === Direction.NEXT ? 1 : -1;
        }

        currentSceneIdx += direction === Direction.NEXT ? 1 : -1;
        currentDialogIdx =
          direction === Direction.NEXT
            ? 0
            : currentSceneIdx >= 0
              ? sceneData[currentSceneIdx]?.dialogs.length - 1
              : -1;
      }

      return null;
    },
    [sceneData],
  );

  const handleExactSceneTransition = useCallback(
    ({ nextSceneIndex, nextDialogIndex, skippedScenes }: SceneTransitionOptions) => {
      const currentNavigation = {
        sceneIndex: currentSceneIndex,
        dialogIndex: dialogIndex,
        skippedScenes: skippedScenes || 0,
      };
      if (nextSceneIndex !== undefined) {
        setCurrentSceneIndex(nextSceneIndex);
        hasSameSceneType.current = sceneData[nextSceneIndex].type === sceneData[currentSceneIndex].type
        setShowContent(hasSameSceneType.current);
        updateProgress(Direction.NEXT);
      }
      if (nextDialogIndex !== undefined) {
        setDialogIndex(nextDialogIndex);
      }
      if (hasChoiceScreen) {
        navigationHistory.current.push(currentNavigation);
      }
    },
    [currentSceneIndex, dialogIndex, setCurrentSceneIndex, updateProgress, setDialogIndex, hasChoiceScreen],
  );

  const handleDirectionalSceneTransition = useCallback(
    (direction: Direction.NEXT | Direction.BACK) => {
      if (hasChoiceScreen) {
        if (direction === Direction.BACK && navigationHistory.current.length > 0) {
          const {
            dialogIndex: previousDialogIndex,
            sceneIndex: previousSceneIndex,
            skippedScenes,
          } = navigationHistory.current.pop()!;
          setCurrentSceneIndex(previousSceneIndex);
          hasSameSceneType.current = sceneData[previousSceneIndex].type === sceneData[currentSceneIndex].type;
          setShowContent(hasSameSceneType.current);
          if (previousSceneIndex !== currentSceneIndex) {
            updateProgress(direction);
          }
          if (skippedScenes && skippedScenes > 0) {
            updateProgress(direction, skippedScenes);
          }
          setDialogIndex(previousDialogIndex);
          return;
        }
      } else {
        if (direction === Direction.BACK) {
          const previousValidIndex = findNextValidDialog(currentSceneIndex, dialogIndex - 1, direction);
          setCurrentSceneIndex(previousValidIndex!.sceneIndex);
          hasSameSceneType.current = sceneData[previousValidIndex!.sceneIndex].type === sceneData[currentSceneIndex].type;
          setShowContent(hasSameSceneType.current);
          if (previousValidIndex?.sceneIndex !== currentSceneIndex) {
            updateProgress(direction);
          }
          setDialogIndex(previousValidIndex!.dialogIndex);
          return;
        }
      }

      const nextValid = findNextValidDialog(currentSceneIndex, dialogIndex + 1, Direction.NEXT);

      if (currentSceneIndex === sceneData.length - 1) {
        //? This if clause represents Start again
        setCurrentSceneIndex(0);
        setShowContent(false);
        updateProgress(direction);
        setDialogIndex(0);
        resetBranchState();
      } else if (nextValid) {
        const sceneDialogKey = `${currentSceneIndex}_${dialogIndex}`;
        if (isEndOfBranch(sceneDialogKey)) {
          const isBranchCompleted = getBranch(sceneDialogKey)?.isCompleted;
          if (!isBranchCompleted) {
            completeBranch(sceneDialogKey);
          }
          const nextBranch = getNextBranch(sceneDialogKey);
          if (nextBranch) {
            handleExactSceneTransition({
              nextSceneIndex: nextBranch.startSceneIndex,
              nextDialogIndex: nextBranch.startDialogIndex,
            });
            return;
          } else {
            const highestEndPath = getHighestEndPath(sceneDialogKey);
            if (highestEndPath) {
              const nextValidAfterAllBranchesForRoot = findNextValidDialog(
                highestEndPath.endSceneIndex,
                highestEndPath.endDialogIndex + 1,
                Direction.NEXT,
              );
              if (nextValidAfterAllBranchesForRoot) {
                let skippedScenes = 0;
                if (isBranchCompleted) {
                  skippedScenes = getOtherBranchesSceneCount(sceneDialogKey);
                  updateProgress(Direction.NEXT, skippedScenes);
                }
                handleExactSceneTransition({
                  nextSceneIndex: nextValidAfterAllBranchesForRoot.sceneIndex,
                  nextDialogIndex: nextValidAfterAllBranchesForRoot.dialogIndex,
                  skippedScenes,
                });
              }
            } else {
              handleExactSceneTransition({
                nextSceneIndex: nextValid.sceneIndex,
                nextDialogIndex: nextValid.dialogIndex,
              });
            }
            return;
          }
        }
        if (nextValid.sceneIndex !== currentSceneIndex) {
          updateProgress(direction);
          setCurrentSceneIndex(nextValid.sceneIndex);
          hasSameSceneType.current = sceneData[nextValid.sceneIndex].type === sceneData[currentSceneIndex].type;
          setShowContent(hasSameSceneType.current);
        }
        setDialogIndex(nextValid.dialogIndex);

        //? This if clause represents Finish
        if (
          nextValid.sceneIndex === sceneData.length - 1 &&
          nextValid.dialogIndex === sceneData[nextValid.sceneIndex].dialogs.length - 1
        ) {
          setStatus('passed');
          setScore(100);
          setStatus('completed');
        }
      }
      if (hasChoiceScreen) {
        navigationHistory.current.push({ sceneIndex: currentSceneIndex, dialogIndex });
      }
    },
    [
      currentSceneIndex,
      dialogIndex,
      findNextValidDialog,
      setCurrentSceneIndex,
      setDialogIndex,
      sceneData,
      resetBranchState,
      isEndOfBranch,
      completeBranch,
      getNextBranch,
      getHighestEndPath,
      handleExactSceneTransition,
      setStatus,
      setScore,
      updateProgress,
      getBranch,
      getOtherBranchesSceneCount,
      hasChoiceScreen
    ],
  );

  return {
    handleDirectionalSceneTransition,
    handleExactSceneTransition,
    findNextValidDialog,
  };
};
