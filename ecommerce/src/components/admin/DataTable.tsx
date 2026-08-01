import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
  width?: string;
  hideOnMobile?: boolean;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: () => void;
  emptyMessage?: string;
  loading?: boolean;
  renderMobileCard?: (row: T, isSelected: boolean) => ReactNode;
}

export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectable = false,
  selected,
  onToggleRow,
  onToggleAll,
  emptyMessage = 'No items',
  loading = false,
  renderMobileCard,
}: Props<T>) {
  const allSelected = selectable && selected && rows.length > 0 && rows.every(r => selected.has(rowKey(r)));

  return (
    <>
      {renderMobileCard && (
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-ink-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 bg-white border border-ink-200 rounded-2xl text-ink-500">
              {emptyMessage}
            </div>
          ) : (
            rows.map(row => {
              const id = rowKey(row);
              const isSelected = selected?.has(id) ?? false;
              return (
                <div key={id}>
                  {renderMobileCard(row, isSelected)}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="hidden lg:block bg-white border border-ink-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-100 text-sm">
              <tr>
                {selectable && (
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAll}
                      aria-label="Select all"
                      className="w-4 h-4 rounded border-ink-300"
                    />
                  </th>
                )}
                {columns.map(c => (
                  <th
                    key={c.key}
                    className={`text-left p-4 font-semibold text-ink-700 ${c.className || ''}`}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-8 text-center">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-ink-100 rounded w-1/3 mx-auto" />
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-8 text-center text-ink-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map(row => {
                  const id = rowKey(row);
                  const isSelected = selected?.has(id) ?? false;
                  return (
                    <tr
                      key={id}
                      className={`border-t border-ink-100 hover:bg-ink-50 transition-colors ${isSelected ? 'bg-brand-50' : ''}`}
                    >
                      {selectable && (
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleRow?.(id)}
                            aria-label={`Select row ${id}`}
                            className="w-4 h-4 rounded border-ink-300"
                          />
                        </td>
                      )}
                      {columns.map(c => (
                        <td key={c.key} className={`p-4 ${c.className || ''}`}>
                          {c.render(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-ink-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-ink-200 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-ink-200 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}