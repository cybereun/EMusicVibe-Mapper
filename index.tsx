import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * BYOK (Bring Your Own Key) Support
 * This shim ensures process.env.API_KEY is available even in environments 
 * without build-time environment variable injection.
 */
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  const savedKey = localStorage.getItem('user_gemini_key');
  if (savedKey) {
    (window as any).process.env.API_KEY = savedKey;
  }
}

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Ensure mounting happens after DOM content is loaded if script is not deferred
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
