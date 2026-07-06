import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './game/App.jsx';
import './game/game.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
