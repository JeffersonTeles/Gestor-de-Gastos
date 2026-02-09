import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remover após duração
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [removeNotification]);

  const success = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration });
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Componente visual das notificações
const NotificationContainer: React.FC<{
  notifications: Notification[];
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-md w-full pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: () => void;
}> = ({ notification, onRemove }) => {
  const styles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      IconComponent: CheckCircle,
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
      icon: 'text-rose-600 dark:text-rose-400',
      IconComponent: AlertCircle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      icon: 'text-amber-600 dark:text-amber-400',
      IconComponent: AlertTriangle,
    },
    info: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      IconComponent: Info,
    },
  };

  const style = styles[notification.type];
  const Icon = style.IconComponent;

  return (
    <div
      className={`${style.bg} border rounded-2xl p-4 shadow-lg backdrop-blur-sm pointer-events-auto animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`${style.icon} mt-0.5`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            {notification.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          aria-label="Fechar notificação"
        >
          <X size={16} className="text-slate-500 dark:text-zinc-400" />
        </button>
      </div>
    </div>
  );
};
