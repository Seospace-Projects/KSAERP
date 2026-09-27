import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure window.fetch is writable and has a setter to avoid "Cannot set property fetch of #<Window> which has only a getter"
if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch;
    let activeFetch = typeof origFetch === 'function' ? (...args: any[]) => origFetch.apply(window, args as any) : origFetch;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      Object.defineProperty(window, 'fetch', {
        get: () => activeFetch,
        set: (fn) => { activeFetch = fn; },
        configurable: true,
        enumerable: true
      });
    }
  } catch (_e) {
    // Ignore if not configurable
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
