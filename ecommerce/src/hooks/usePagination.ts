import { useMemo, useState } from 'react';

export interface UsePaginationOptions {
  total: number;
  pageSize?: number;
  initialPage?: number;
}

export interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  slice: (items: T[]) => T[];
  pageItems: (items: T[]) => T[];
  reset: () => void;
}

export function usePagination<T>({
  total,
  pageSize = 10,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationResult<T> {
  const [page, setPage] = useState(initialPage);
  const [size, setPageSize] = useState(pageSize);

  const totalPages = Math.max(1, Math.ceil(total / size));

  if (page > totalPages) {
    setPage(totalPages);
  }

  return useMemo(
    () => ({
      page,
      pageSize: size,
      totalPages,
      setPage: (p) => setPage(Math.min(Math.max(1, p), totalPages)),
      setPageSize: (n) => {
        setPageSize(n);
        setPage(1);
      },
      slice: (items: T[]) => {
        const start = (page - 1) * size;
        return items.slice(start, start + size);
      },
      pageItems: (items: T[]) => {
        const start = (page - 1) * size;
        return items.slice(start, start + size);
      },
      reset: () => setPage(1),
    }),
    [page, size, totalPages]
  );
}