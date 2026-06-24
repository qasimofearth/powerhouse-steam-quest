// App.tsx
import './App.css';
import { GAME_TITLES, LAUNCHER } from './constants/constants';
import { Suspense, lazy } from 'react';
import Game from './components/Game';
import { ScormProvider } from './contexts/ScormContextProvider';
import { useTranslations } from './hooks/useTranslations';

const Launcher = lazy(() => import('./components/Launcher/Launcher'));

function App() {
  const gameId = import.meta.env.VITE_GAME_ID;
  const isLauncher = gameId === LAUNCHER;
  const { t } = useTranslations();

  if (gameId) {
    const title = GAME_TITLES.get(gameId);
    if (title) {
      const translatedTitle = t(title);
      if (translatedTitle && translatedTitle !== title) {
        document.title = translatedTitle;
      }
    }
  }

  return (
    <div className="App h-full">
      {isLauncher ? (
        <Suspense fallback={<div>Loading...</div>}>
          <Launcher />
        </Suspense>
      ) : (
        <ScormProvider>
          <Game />
        </ScormProvider>
      )}
    </div>
  );
}

export default App;
