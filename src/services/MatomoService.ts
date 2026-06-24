declare global {
  interface Window {
    _paq: unknown[];
  }
}

const MATOMO_URL = 'https://questsplaypowerai.matomo.cloud/';
const SITE_ID = '1';

export const initializeMatomo = (): void => {
  // Initialize _paq if not already done
  window._paq = window._paq || [];

  // Set up basic tracking
  window._paq.push(['trackPageView']);
  window._paq.push(['enableLinkTracking']);

  // Initialize the tracker
  const u = MATOMO_URL;
  window._paq.push(['setTrackerUrl', u + 'matomo.php']);
  window._paq.push(['setSiteId', SITE_ID]);

  // Load the Matomo script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://cdn.matomo.cloud/questsplaypowerai.matomo.cloud/matomo.js';

  // Insert the script into the document
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
};
