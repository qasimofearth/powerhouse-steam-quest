export const isStagingUrl = (): boolean => {
  try {
    return window.location.pathname.includes('-stage/');
  } catch (error) {
    console.warn('Failed to check if URL is staging:', error);
    return false;
  }
}; 