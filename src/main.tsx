import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { queryClient } from './lib/queryClient';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element.');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* AuthProvider sits inside the router so it can react to navigation,
            and inside the query client so it can clear caches on sign-out. */}
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            closeButton
            toastOptions={{
              style: {
                background: '#0C1B2C',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#EAF4FB',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
