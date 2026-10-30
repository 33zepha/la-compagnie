import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './store.tsx';
import { App } from './App.tsx';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider><App /></GameProvider>
  </StrictMode>,
);
