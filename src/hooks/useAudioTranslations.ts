import { useGameContext } from './useGameContext';

export const useAudioTranslation = (audioUrl: string | undefined) => {
  const { language } = useGameContext();

  if (!audioUrl) return undefined;

  // Extract the base path and file extension
  const match = audioUrl.match(/^(.+)_en\.(mp3|webm)$/);
  if (!match) return audioUrl;

  const [, basePath, extension] = match;
  return `${basePath}_${language}.${extension}`;
};
