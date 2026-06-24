export const isMobileDevice = (): boolean => {
  const ua = navigator.userAgent;

  if (/iPad|Tablet|PlayBook/i.test(ua)) return false;

  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return false;

  return /Mobi|iPhone|Android|IEMobile|BlackBerry/i.test(ua);
};
