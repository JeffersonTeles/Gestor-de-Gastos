/**
 * Registra o Service Worker para funcionalidade PWA
 */

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/',
        }
      );

      console.log('[PWA] Service Worker registrado com sucesso:', registration);

      // Verificar atualizações a cada 60 segundos
      setInterval(() => {
        registration.update();
      }, 60000);

      // Listener para atualização do Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              console.log('[PWA] Nova versão disponível');
              
              // Você pode mostrar uma notificação para o usuário atualizar
              if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('[PWA] Erro ao registrar Service Worker:', error);
    }
  } else {
    console.warn('[PWA] Service Workers não são suportados neste navegador');
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('[PWA] Service Worker desregistrado');
  }
};

// Solicitar permissão para notificações
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
};

// Exibir notificação
export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    }
  }
};

// Verificar se o app está instalado como PWA
export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// Registrar sincronização em background
export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('[PWA] Background sync registrado:', tag);
    } catch (error) {
      console.error('[PWA] Erro ao registrar background sync:', error);
    }
  }
};

// Verificar se está online
export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

// Listeners para mudança de status de conexão
export const setupOnlineStatusListeners = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Retorna função para cleanup
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// Verificar suporte a recursos PWA
export const checkPWASupport = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notification: 'Notification' in window,
    pushManager: 'PushManager' in window,
    syncManager: 'SyncManager' in window,
    storage: 'storage' in navigator && 'estimate' in navigator.storage,
  };
};

// Solicitar instalação do PWA
export const promptInstall = async (): Promise<void> => {
  // Evento beforeinstallprompt deve ser capturado antes
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Resposta do usuário:', outcome);
    (window as any).deferredPrompt = null;
  }
};

// Estimar uso de storage
export const estimateStorageUsage = async (): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;
    
    return {
      usage,
      quota,
      percentage,
    };
  }
  
  return null;
};
