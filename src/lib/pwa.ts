/**
 * Configuração e registro do Service Worker para PWA
 * Permite funcionamento offline e instalação no dispositivo
 */

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registrado com sucesso:', registration.scope);

      // Verificar atualizações a cada 1 hora
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Notificar quando houver atualização disponível
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão disponível
            if (confirm('Nova versão disponível! Atualizar agora?')) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  }
};

// Detectar se o app está rodando como PWA
export const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Verificar se pode instalar como PWA
export const canInstallPWA = (): boolean => {
  return 'BeforeInstallPromptEvent' in window;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Capturar evento de instalação
export const setupInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('📱 PWA pode ser instalado');
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalado com sucesso');
    deferredPrompt = null;
  });
};

// Mostrar prompt de instalação
export const showInstallPrompt = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferredPrompt) {
    return 'unavailable';
  }

  await deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  deferredPrompt = null;

  return choiceResult.outcome;
};

// Verificar conectividade
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Callbacks de conectividade
export const onConnectivityChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Cache de dados offline
export const cacheData = async (key: string, data: any): Promise<void> => {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Erro ao salvar no cache:', error);
  }
};

export const getCachedData = <T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): T | null => {
  try {
    const cached = localStorage.getItem(`offline_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      localStorage.removeItem(`offline_${key}`);
      return null;
    }

    return data as T;
  } catch (error) {
    console.error('Erro ao ler cache:', error);
    return null;
  }
};
