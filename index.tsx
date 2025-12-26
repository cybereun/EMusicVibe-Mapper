
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Ensure process.env.API_KEY is available for the SDK in standalone environments
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  const savedKey = localStorage.getItem('user_gemini_key');
  if (savedKey) {
    (window as any).process.env.API_KEY = savedKey;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
