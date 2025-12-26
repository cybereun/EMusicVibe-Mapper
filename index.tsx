
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * BYOK (Bring Your Own Key) Support Shim
 * This ensures process.env.API_KEY is available even in environments 
 * without build-time environment variable injection.
 */
if (typeof window !== 'undefined') {
  // Ensure process.env exists
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  /**
   * Guidelines: The application must not ask the user for the API key directly via input fields.
   * Removing manual key population from localStorage.
   */
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
