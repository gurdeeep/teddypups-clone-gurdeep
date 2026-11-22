import { createRoot } from 'react-dom/client';
import { App } from './App';
import { preloadPage } from './lib/router';
import './reference.css';

// The stylesheet targets `body > .tp-curtain`, `body > header` and so on, so the
// app renders straight into <body> instead of a wrapper element.
preloadPage(location.pathname).then(() => createRoot(document.body).render(<App />));
