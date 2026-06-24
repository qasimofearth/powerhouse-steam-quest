import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GameProvider } from './contexts/GameProvider.tsx';
import { MathJaxWrapper } from './components/MathJaxWrapper.tsx';
import { initializeMatomo } from './services/MatomoService.ts';
import { Environment } from './constants/constants.ts';
import { UnsupportedDeviceMessage } from './components/UnsupportedDeviceMessage.tsx';
import { isMobileDevice } from './utils/deviceDetection.ts';

if (process.env.NODE_ENV === Environment.PRODUCTION) {
  initializeMatomo();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isMobileDevice() ? (
      <UnsupportedDeviceMessage />
    ) : (
      <GameProvider>
        <MathJaxWrapper>
          <App />
        </MathJaxWrapper>
      </GameProvider>
    )}
  </StrictMode>,
);
