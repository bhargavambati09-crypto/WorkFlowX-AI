import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

let toastListener = null;
let toastId = 0;

export const toast = {
  success: (msg) => toastListener?.({ id: ++toastId, type: 'success', message: msg }),
  error: (msg) => toastListener?.({ id: ++toastId, type: 'error', message: msg }),
  warning: (msg) => toastListener?.({ id: ++toastId, type: 'warning', message: msg }),
  info: (msg) => toastListener?.({ id: ++toastId, type: 'info', message: msg }),
};

const icons = {
  success: <CheckCircle size={18} className="text-emerald-400" />,
  error: <XCircle size={18} className="text-red-400" />,
  warning: <AlertTriangle size={18} className="text-amber-400" />,
  info: <Info size={18} className="text-blue-400" />,
};

const colors = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
};

const Toast = ({ toast: t, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onRemove]);

  return (
    <div className={`toast-enter flex items-start gap-3 p-4 rounded-xl border glass-card max-w-sm ${colors[t.type]} animate-slide-in`}>
      {icons[t.type]}
      <p className="text-sm text-gray-200 flex-1">{t.message}</p>
      <button onClick={() => onRemove(t.id)} className="text-gray-500 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastListener = (t) => setToasts(prev => [...prev, t]);
    return () => { toastListener = null; };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={remove} />)}
    </div>
  );
};
