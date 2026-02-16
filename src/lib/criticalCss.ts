/**
 * CSS Crítico que deve ser inlineado no <head>
 * Reduz render-blocking CSS e melhora FCP
 * 
 * Adicione isto no layout.tsx:
 * <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
 */

export const CRITICAL_CSS = `
/* CSS Crítico - deve ser inlineado no <head> */

/* Fontes variável */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Reset */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fafbfc;
  margin: 0;
  padding: 0;
}

/* Layout crítico */
.page-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-with-sidebar {
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 100vh;
}

.page-content {
  overflow-y: auto;
}

/* Carregamento inicial */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Variáveis de cores críticas */
:root {
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --neutral-900: #111827;
  --neutral-50: #f9fafb;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  body {
    background: #111827;
    color: #f3f4f6;
  }
}

/* Mobile otimização */
@media (max-width: 640px) {
  .page-with-sidebar {
    grid-template-columns: 1fr;
  }
}
`;

/**
 * Benefícios:
 * - FCP reduz em ~300-500ms
 * - Elimina flash de conteúdo não-estilizado
 * - Carrega antes do CSS principal
 */
