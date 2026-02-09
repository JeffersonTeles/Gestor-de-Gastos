import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

console.log('🚀 main.tsx carregado');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('✅ Elemento root encontrado');
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <DataProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <App />
              </BrowserRouter>
            </DataProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ React renderizado');
} else {
  console.error("❌ ERRO CRITICO: Elemento root nao encontrado");
  document.body.innerHTML = '<div style="color:red;padding:20px;font-size:24px;">ERRO: Elemento root não encontrado!</div>';
}
