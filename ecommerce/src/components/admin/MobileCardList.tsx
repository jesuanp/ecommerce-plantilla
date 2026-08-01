import type { ReactNode } from 'react';

interface Props<T> {
  rows: T[];
  renderCard: (row: T, isSelected: boolean) => ReactNode;
  rowKey: (row: T) => string;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  emptyMessage?: string;
}

export default function MobileCardList<T>({
  rows,
  renderCard,
  rowKey,
  selected,
  emptyMessage = 'No items',
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="lg:hidden text-center py-12 bg-white border border-ink-200 rounded-2xl text-ink-500">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="lg:hidden space-y-3">
      {rows.map(row => {
        const id = rowKey(row);
        const isSelected = selected?.has(id) ?? false;
        return <div key={id}>{renderCard(row, isSelected)}</div>;
      })}
    </div>
  );
}