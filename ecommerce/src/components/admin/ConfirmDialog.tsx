import { create } from 'zustand';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (value: boolean) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  options: null,
  resolver: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      set({ options, resolver: resolve });
    }),
  resolve: (value) =>
    set((s) => {
      s.resolver?.(value);
      return { options: null, resolver: null };
    }),
  close: () =>
    set((s) => {
      s.resolver?.(false);
      return { options: null, resolver: null };
    }),
}));

export const useConfirm = () => {
  const ask = useConfirmStore((s) => s.ask);
  return ask;
};

export default function ConfirmDialog() {
  const options = useConfirmStore((s) => s.options);
  const resolve = useConfirmStore((s) => s.resolve);
  const close = useConfirmStore((s) => s.close);

  if (!options) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-ink-900/50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={
              options.danger
                ? 'w-10 h-10 rounded-full bg-red-100 grid place-items-center shrink-0'
                : 'w-10 h-10 rounded-full bg-ink-100 grid place-items-center shrink-0'
            }
          >
            <AlertTriangle
              className={options.danger ? 'w-5 h-5 text-red-600' : 'w-5 h-5 text-ink-700'}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold">{options.title}</h3>
            <p className="mt-1 text-sm text-ink-500">{options.message}</p>
          </div>
          <button
            onClick={close}
            className="p-1 -mt-1 -mr-1 rounded hover:bg-ink-100"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={close} className="btn-secondary">
            {options.cancelText || 'Cancel'}
          </button>
          <button
            onClick={() => resolve(true)}
            className={
              options.danger
                ? 'inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all duration-200'
                : 'btn-primary'
            }
          >
            {options.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}