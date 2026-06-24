import { useEffect, useState, useCallback, useMemo } from 'react';
import { SceneData } from '../types/interfaces';
import { useAudioTranslation } from '../hooks/useAudioTranslations';
import { useGameContext } from '../hooks/useGameContext';
import AudioControlButtons from './AudioControlButtons';
import useAudioState from '../hooks/useAudioState';

const AudioControls: React.FC<{ sceneData: SceneData[] }> = ({ sceneData }) => {
  const [showVolumeControl, setShowVolumeControl] = useState<boolean>(false);
  const { currentSceneIndex, dialogIndex, showContent } = useGameContext();
  const backgroundAudioUrl = sceneData[0].audioUrl;
  const currentScene = sceneData[currentSceneIndex];
  const currentDialog = currentScene.dialogs[dialogIndex];
  const translatedDialogAudio = useAudioTranslation(currentDialog?.audioUrl);

  const {
    playBackgroundAudio,
    pauseBackgroundAudio,
    playDialogAudio,
    pauseDialogAudio,
    isDialogPlaying,
    isDialogDonePlaying,
    backgroundVolume,
    setBackgroundVolume,
    dialogVolume,
    setDialogVolume,
    isMuted,
    toggleMute,
  } = useAudioState(backgroundAudioUrl || '', translatedDialogAudio);

  // Background Audio effect
  useEffect(() => {
    if (currentSceneIndex > 0) {
      playBackgroundAudio();
    }
    return () => pauseBackgroundAudio();
  }, [currentSceneIndex, playBackgroundAudio, pauseBackgroundAudio]);

  // Dialog Audio effect
  useEffect(() => {
    if (!showContent) {
      pauseDialogAudio();
      return;
    }
    if (currentDialog?.audioUrl) {
      playDialogAudio();
    }
    return () => {
      pauseDialogAudio();
    };
  }, [currentDialog?.audioUrl, playDialogAudio, pauseDialogAudio, showContent]);

  const handleDialogAudio = useCallback(() => {
    if (isDialogPlaying) {
      pauseDialogAudio();
    } else {
      playDialogAudio();
    }
  }, [isDialogPlaying, pauseDialogAudio, playDialogAudio]);

  const audioControlProps = useMemo(
    () => ({
      isDialogPlaying,
      isDialogDonePlaying,
      handleDialogAudio,
      isMuted,
      toggleMute,
      showVolumeControl,
      setShowVolumeControl,
      backgroundVolume,
      setBackgroundVolume,
      dialogVolume,
      setDialogVolume,
      hasDialogAudio: !!currentDialog?.audioUrl,
    }),
    [
      isDialogPlaying,
      isDialogDonePlaying,
      handleDialogAudio,
      isMuted,
      toggleMute,
      showVolumeControl,
      backgroundVolume,
      dialogVolume,
      setShowVolumeControl,
      setBackgroundVolume,
      setDialogVolume,
      currentDialog?.audioUrl,
    ]
  );

  if (currentSceneIndex <= 0) return null;

  return <AudioControlButtons {...audioControlProps} />;
};

export default AudioControls;
