import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioConfig } from '../types/interfaces';
import { getAssetPath } from '../utils/assetPath';

export const useAudio = (audioUrl: string, config?: AudioConfig) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDonePlaying, setIsDonePlaying] = useState(false);
  const [volume, setVolume] = useState(config?.volume ?? 1);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(getAssetPath(audioUrl));
    audio.loop = config?.loop ?? false;
    audio.volume = volume;
    audioRef.current = audio;
    updatePlaybackRate();

    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('ended', () => {
      if (!config?.loop) {
        setIsPlaying(false);
        setIsDonePlaying(true);
      }
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, config?.loop]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      updatePlaybackRate();
    }
  }, [volume]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsDonePlaying(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const updatePlaybackRate = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = volume === 0 ? 0 : 1;
    }
  }, [volume]);

  return {
    isPlaying,
    isDonePlaying,
    volume,
    play,
    pause,
    setVolume,
  };
};
