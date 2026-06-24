/**
 * Checks if the current browser is Safari
 * @returns boolean indicating if the browser is Safari
 */
export const isSafari = (): boolean => {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') return false;

  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
