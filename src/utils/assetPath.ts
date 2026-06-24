export const getAssetPath = (assetPath: string): string => {
  const gameId = import.meta.env.VITE_GAME_ID;
  const cleanPath = assetPath.replace(/^\/assets\//, '');

  if (import.meta.env.DEV) {
    return `./src/GAME_DATA/${gameId}/assets/${cleanPath}`;
  }

  return `./assets/${cleanPath}`;
};
