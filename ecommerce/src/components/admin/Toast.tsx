import { create } from 'zustand';
import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const useToast = () => {
  const push = useToastStore((s) => s.push);
  return {
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
  };
};

export default function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);

  useEffect(() => {
    return () => {
      useToastStore.setState({ toasts: [] });
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info;
  const colorClass =
    toast.kind === 'success'
      ? 'bg-green-50 text-green-900 border-green-200'
      : toast.kind === 'error'
      ? 'bg-red-50 text-red-900 border-red-200'
      : 'bg-blue-50 text-blue-900 border-blue-200';
  const iconClass =
    toast.kind === 'success'
      ? 'text-green-600'
      : toast.kind === 'error'
      ? 'text-red-600'
      : 'text-blue-600';

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 border rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2',
        colorClass
      )}
      role="status"
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconClass)} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        className="p-0.5 -mt-0.5 -mr-1 rounded hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}