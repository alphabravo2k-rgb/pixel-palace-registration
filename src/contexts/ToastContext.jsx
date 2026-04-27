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
              relative pointer-events-auto flex items-center gap-3 px-6 py-4 rounded overflow-hidden
              backdrop-blur-xl animate-in slide-in-from-right-10 fade-in duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)]
              border-l-4
              ${toast.type === 'success' ? 'bg-black/80 border-l-neon-cyan border-white/5 text-neon-cyan' : ''}
              ${toast.type === 'error' ? 'bg-black/80 border-l-red-500 border-white/5 text-red-500' : ''}
              ${toast.type === 'info' ? 'bg-black/80 border-l-white border-white/5 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-black/80 border-l-yellow-500 border-white/5 text-yellow-500' : ''}
            `}
          >
            <div className="font-heading text-xs uppercase tracking-[0.2em]">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 opacity-40 hover:opacity-100 transition-opacity text-[10px]"
            >
              [X]
            </button>
            {/* Progress Bar Animation */}
            <div 
              className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-toast-progress
                ${toast.type === 'success' ? 'bg-neon-cyan' : ''}
                ${toast.type === 'error' ? 'bg-red-500' : ''}
                ${toast.type === 'info' ? 'bg-white' : ''}
                ${toast.type === 'warning' ? 'bg-yellow-500' : ''}
              `}
              style={{ animationDuration: '4000ms' }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
