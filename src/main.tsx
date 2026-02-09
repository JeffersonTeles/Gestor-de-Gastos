import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import { registerServiceWorker, setupOnlineStatusListeners } from './utils/pwa';

console.log('🚀 main.tsx carregado');

// Registrar Service Worker para PWA
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

// Setup listeners de status online/offline
setupOnlineStatusListeners(
  () => console.log('🟢 Online'),
  () => console.log('🔴 Offline')
);

// Capturar evento de instalação do PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  console.log('💾 PWA pode ser instalado');
});

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('✅ Elemento root encontrado');
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <ThemeProvider>
              <DataProvider>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                  <App />
                </BrowserRouter>
              </DataProvider>
            </ThemeProvider>
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ React renderizado');
} else {
  console.error("❌ ERRO CRITICO: Elemento root nao encontrado");
  document.body.innerHTML = '<div style="color:red;padding:20px;font-size:24px;">ERRO: Elemento root não encontrado!</div>';
}
