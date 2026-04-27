import { createContext, useContext, useState, useCallback } from 'react';
import { Terminal } from '../utils/logger';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    Terminal.log('TOAST', `[${type.toUpperCase()}] ${message}`);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl
              backdrop-blur-md animate-in slide-in-from-right-8 fade-in duration-300
              ${toast.type === 'success' ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : ''}
              ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : ''}
              ${toast.type === 'info' ? 'bg-white/5 border-white/10 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : ''}
            `}
          >
            <div className="font-mono text-sm tracking-wide">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
