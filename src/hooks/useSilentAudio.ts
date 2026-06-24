import { useRef, useCallback } from 'react';

export const useSilentAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const createSilentAudio = useCallback((durationInSeconds = 1) => {
    const sampleRate = 8000;
    const numChannels = 1;
    const bitsPerSample = 8;

    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = Math.ceil(durationInSeconds * sampleRate) * blockAlign;
    const chunkSize = 36 + dataSize;
    const byteLength = 8 + chunkSize;

    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, chunkSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    for (let offset = 44; offset < byteLength; offset++) {
      view.setUint8(offset, 128);
    }

    const blob = new Blob([view], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }, []);

  const playSilentAudio = useCallback((durationInMs = 1500, onEndCallback?: () => void) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const silentAudioUrl = createSilentAudio(durationInMs / 1000);
      audioRef.current.src = silentAudioUrl;
      
      audioRef.current.onended = onEndCallback ? onEndCallback : null;

      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing silent audio:', error);
        });
      }
    } catch (error) {
      console.error('Error in playSilentAudio:', error);
    }
  }, [createSilentAudio]);

  const stopSilentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return {
    playSilentAudio,
    stopSilentAudio
  };
};