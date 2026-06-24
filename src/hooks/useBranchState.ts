import { useState, useCallback, useEffect } from 'react';
import { BranchPoint, BranchState, SceneData } from '../types/interfaces';
import extractDestinations from '../utils/extractDestinations';
import { useTranslations } from './useTranslations';

export const useBranchState: (sceneData: SceneData[]) => BranchState = (sceneData) => {
  const [branchPoints, setBranchPoints] = useState<BranchPoint[]>([]);
  const [branchMap, setBranchMap] = useState<{
    [key: string]: {
      root: string;
      branchIndex: number;
    };
  }>({});
  const { t } = useTranslations();

  const resolvePath = useCallback((path: string) => {
    const [start, end] = path.split(',');
    const [startSceneIndex, startDialogIndex] = start.split('_').map(Number);
    const [endSceneIndex, endDialogIndex] = end.split('_').map(Number);

    return {
      startSceneIndex,
      startDialogIndex,
      endSceneIndex,
      endDialogIndex,
    };
  }, []);

  const getBranchMap = () => {
    return branchMap;
  }

  const mapBranchPaths = (branchPoint: BranchPoint) => {
    const { branches } = branchPoint;

    setBranchMap((prevMap) => {
      const newMap = { ...prevMap };
      let branchIndex = 0;
      for (const branch of branches) {
        const { path } = branch;
        const { startSceneIndex, startDialogIndex, endSceneIndex, endDialogIndex } = resolvePath(path);

        for (let i = startSceneIndex; i <= endSceneIndex; i++) {
          const dialogs = sceneData[i].dialogs;
          let lastDialogIndex = dialogs.length - 1;
          let startDialogIdx = 0;

          if (i === endSceneIndex) {
            lastDialogIndex = endDialogIndex;
          }

          if (i === startSceneIndex) {
            startDialogIdx = startDialogIndex;
          }

          for (let j = startDialogIdx; j <= lastDialogIndex; j++) {
            const sceneDialogKey = `${i}_${j}`;
            newMap[sceneDialogKey] = {
              root: branchPoint.root,
              branchIndex: branchIndex,
            };
          }
        }
        branchIndex++;
      }
      return newMap;
    });
  };

  const registerBranchPoint = (root: string, path: string) => {
    setBranchPoints((prev) => {
      const existingPoint = prev.find((point) => point.root === root);

      if (existingPoint) {
        if (!existingPoint.branches.some((branch) => branch.path === path)) {
          mapBranchPaths(existingPoint);
          existingPoint.branches.push({ path, isCompleted: false });
        }
        return [...prev];
      }

      const branchPoint = {
        root,
        branches: [{ path, isCompleted: false }],
      };

      mapBranchPaths(branchPoint);

      return [...prev, branchPoint];
    });
  };

  useEffect(() => {
    //? This code is here to parse scenedata to get branchPoints for any and all buttons in sceneData of game.
    sceneData.forEach((scene, sceneIndex) => {
      const { dialogs } = scene;
      dialogs.forEach((dialog, dialogIndex) => {
        const root = `${sceneIndex}_${dialogIndex}`;
        if (dialog.bodyAsHtml) {
          const dataDestinationMatches = extractDestinations(dialog.bodyAsHtml, t);
          if (dataDestinationMatches?.length) {
            dataDestinationMatches.forEach((match) => {
              const destination = match.replace(/['"]/g, '');
              registerBranchPoint(root, destination);
            });
          }
        }
      });
    });
    //? be careful when you update the deps array here. Don't add what is not needed. You can ignore warnings for this particular case.
  }, [sceneData]);

  const isEndOfBranch = useCallback(
    (sceneDialogKey: string) => {
      if (!branchMap[sceneDialogKey]) return false;
      const { root, branchIndex } = branchMap[sceneDialogKey];
      const branchPoint = branchPoints.find((point) => point.root === root);
      const branch = branchPoint?.branches[branchIndex];

      if (!branch) return false;

      const { endSceneIndex, endDialogIndex } = resolvePath(branch.path);

      return `${endSceneIndex}_${endDialogIndex}` === sceneDialogKey;
    },
    [branchMap, resolvePath, branchPoints],
  );

  const completeBranch = useCallback(
    (sceneDialogKey: string) => {
      setBranchPoints((prev) => {
        const branchMapVal = branchMap[sceneDialogKey];
        const branchPoint = prev.find((point) => point.root === branchMapVal.root);
        if (branchPoint) {
          branchPoint.branches[branchMapVal.branchIndex].isCompleted = true;
        }
        return [...prev];
      });
    },
    [branchMap],
  );

  const getBranch = useCallback(
    (sceneDialogKey: string) => {
      const { root, branchIndex } = branchMap[sceneDialogKey];
      const branchPoint = branchPoints.find((point) => point.root === root);
      return branchPoint?.branches[branchIndex] || null;
    },
    [branchMap, branchPoints],
  );

  const getOtherBranchesSceneCount = useCallback(
    (sceneDialogKey: string) => {
      const { root, branchIndex: currentBranchIndex } = branchMap[sceneDialogKey];
      const branchPoint = branchPoints.find((point) => point.root === root);

      // Get all branches except the current one
      const otherBranches = branchPoint?.branches.filter((_, index) => index !== currentBranchIndex);

      // Calculate total scenes in other branches
      const totalScenesInOtherBranches = otherBranches?.reduce((totalScenes, branch) => {
        const { startSceneIndex, endSceneIndex } = resolvePath(branch.path);
        const scenesInBranch = endSceneIndex - startSceneIndex + 1;
        return totalScenes + scenesInBranch;
      }, 0);

      return totalScenesInOtherBranches || 0;
    },
    [branchMap, branchPoints, resolvePath],
  );

  const getNextBranch = useCallback(
    (sceneDialogKey: string) => {
      const branchMapVal = branchMap[sceneDialogKey];
      const branchPoint = branchPoints.find((point) => point.root === branchMapVal.root);
      if (!branchPoint) return null;
      const branch = branchPoint.branches.find((branch) => !branch.isCompleted);

      return branch ? resolvePath(branch.path) : null;
    },
    [branchMap, branchPoints, resolvePath],
  );

  const getHighestEndPath = useCallback(
    (sceneDialogKey: string) => {
      const root = branchMap[sceneDialogKey]?.root;
      const point = branchPoints.find((p) => p.root === root);
      if (!point) return null;

      const highestEndPath = point.branches
        .map((branch) => {
          const paths = branch.path.split(',');
          return paths[paths.length - 1];
        })
        .sort((a, b) => {
          const [aScene, aDialog] = a.split('_').map(Number);
          const [bScene, bDialog] = b.split('_').map(Number);
          return bScene - aScene || bDialog - aDialog;
        })[0];

      const [endSceneIndex, endDialogIndex] = highestEndPath.split('_').map(Number);

      return {
        endSceneIndex,
        endDialogIndex,
      };
    },
    [branchMap, branchPoints],
  );

  const resetBranchState = useCallback(() => {
    setBranchPoints([]);
  }, []);

  return {
    completeBranch,
    getNextBranch,
    getHighestEndPath,
    resetBranchState,
    resolvePath,
    isEndOfBranch,
    getBranch,
    getOtherBranchesSceneCount,
    getBranchMap
  };
};
