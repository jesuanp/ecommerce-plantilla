import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export default function AdminPageHeader({ title, description, actions, children }: Props) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-ink-500 mt-1">{description}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}