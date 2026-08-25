/**
 * JavaScript entry point of the frontend.
 * Creates the React root on #root, wraps the tree in StrictMode, BrowserRouter
 * (client-side routing), and AuthProvider (login session), then renders App.
 * Also loads global CSS. This is the first TSX file Vite runs.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import App from '@/App';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
 