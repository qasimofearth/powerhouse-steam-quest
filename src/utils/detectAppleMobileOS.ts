/**
 * Checks if the current device is running iOS
 * @returns boolean indicating if the device is running iOS
 */
export const isIOS = (): boolean => {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;

  // Detect iPhone, iPod, or iPad running iOS
  return /iPhone|iPod/i.test(ua) || (/iPad/.test(ua) && !('MSStream' in window));
};

/**
 * Checks if the current device is running iPadOS
 * @returns boolean indicating if the device is running iPadOS
 */
export const isIPadOS = (): boolean => {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') return false;

  // Modern iPads with iPadOS identify as MacOS in userAgent but support touch
  // This is a good heuristic for detecting iPadOS
  const ua = navigator.userAgent;

  return /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1 && !('MSStream' in window));
};

/**
 * Checks if the current device is running either iOS or iPadOS
 * @returns boolean indicating if the device is running iOS or iPadOS
 */
export const isAppleMobileOS = (): boolean => {
  return isIOS() || isIPadOS();
};
