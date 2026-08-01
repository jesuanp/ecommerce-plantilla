import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  delta?: number;
  icon?: ReactNode;
  hint?: string;
  accent?: 'brand' | 'green' | 'blue' | 'purple' | 'orange';
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function StatsCard({ label, value, delta, icon, hint, accent = 'brand' }: Props) {
  const deltaPositive = delta !== undefined && delta >= 0;
  const deltaText = delta !== undefined
    ? `${deltaPositive ? '+' : ''}${delta.toFixed(1)}%`
    : null;

  return (
    <div className="bg-white border border-ink-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-ink-500 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${ACCENTS[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      {(deltaText || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {deltaText && (
            <span className={deltaPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {deltaText}
            </span>
          )}
          {hint && <span className="text-ink-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}