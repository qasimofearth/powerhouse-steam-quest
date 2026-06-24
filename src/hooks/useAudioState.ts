import { useState } from 'react';
import { useAudio } from './useAudio';

const useAudioState = (backgroundUrl: string, dialogUrl: string | undefined) => {
  const [prevBackgroundVolume, setPrevBackgroundVolume] = useState(0.2);
  const [prevDialogVolume, setPrevDialogVolume] = useState(1);

  const {
    play: playBackgroundAudio,
    pause: pauseBackgroundAudio,
    volume: backgroundVolume,
    setVolume: setBackgroundVolume,
  } = useAudio(backgroundUrl, { loop: true, volume: 0.1 });

  const {
    play: playDialogAudio,
    pause: pauseDialogAudio,
    isPlaying: isDialogPlaying,
    isDonePlaying: isDialogDonePlaying,
    volume: dialogVolume,
    setVolume: setDialogVolume,
  } = useAudio(dialogUrl || '', { loop: false, volume: 0.4 });

  const isMuted = backgroundVolume === 0 && dialogVolume === 0;

  const toggleMute = () => {
    if (isMuted) {
      setBackgroundVolume(prevBackgroundVolume);
      setDialogVolume(prevDialogVolume);
    } else {
      setPrevBackgroundVolume(backgroundVolume);
      setPrevDialogVolume(dialogVolume);
      setBackgroundVolume(0);
      setDialogVolume(0);
    }
  };

  return {
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
  };
};

export default useAudioState;
