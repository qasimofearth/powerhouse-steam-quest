import Scene from './Scene';
import { usePreLoader } from '../hooks/usePreloader';
import LoadingScreen from './LoadingScreen';
import AudioControls from './AudioControls';
import Popover from './Popover';
import { useSceneData } from '../hooks/useSceneData';
import { SceneTransitionProvider } from '../contexts/SceneTransitionProvider';
import ReviewPanel from './ReviewPanel';
import { useTranslations } from '../hooks/useTranslations';

function Game() {
  const sceneData = useSceneData();
  const { isLoading, loadingProgress, error } = usePreLoader(sceneData);
  const { t } = useTranslations();

  // Check for review mode via URL parameter
  const isReviewMode = new URLSearchParams(window.location.search).get('review') === 'true';

  // Get scene names from translations - build manually from flattened keys
  const sceneNames: Record<string, string> | undefined = (() => {
    const prefix = 'scenesList.';
    const result: Record<string, string> = {};
    // Manually build scene names from known keys
    for (let i = 1; i <= 30; i++) {
      const key = `scene_${i}`;
      const value = t(`${prefix}${key}`);
      // Only add if translation exists (not returning the key itself)
      if (value !== `${prefix}${key}`) {
        result[key] = value;
      }
      // Also check for sub-scenes like scene_8b
      const subKey = `scene_${i}b`;
      const subValue = t(`${prefix}${subKey}`);
      if (subValue !== `${prefix}${subKey}`) {
        result[subKey] = subValue;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  })();

  if (error) {
    return <div>Error loading images: {error}</div>;
  }

  if (isLoading || !sceneData?.length) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <div className="text-text h-full" role="main">
      <SceneTransitionProvider sceneData={sceneData}>
        <Scene sceneData={sceneData} />
        <AudioControls sceneData={sceneData} />
        <Popover />
        {isReviewMode && <ReviewPanel sceneData={sceneData} sceneNames={sceneNames} />}
      </SceneTransitionProvider>
    </div>
  );
}

export default Game;
