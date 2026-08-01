import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { productsApi, categoriesApi, adminApi, type Product, type Category } from '../../lib/api';
import { formatPrice, cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';
import DataTable, { type Column, Pagination } from '../../components/admin/DataTable';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../components/admin/Toast';
import { useConfirm } from '../../components/admin/ConfirmDialog';

export default function Products() {
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const initialLowStock = searchParams.get('lowStock') === '1';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>(
    initialLowStock ? 'low' : 'all'
  );
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'yes' | 'no'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const loadProducts = () => {
    productsApi.getAll()
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    let res = products;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      res = res.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      res = res.filter(p => p.category?.id === filterCategory);
    }
    if (filterStock === 'low') {
      res = res.filter(p => p.stock > 0 && p.stock < 5);
    } else if (filterStock === 'out') {
      res = res.filter(p => p.stock === 0);
    }
    if (filterFeatured === 'yes') {
      res = res.filter(p => p.featured);
    } else if (filterFeatured === 'no') {
      res = res.filter(p => !p.featured);
    }
    return res;
  }, [products, debouncedSearch, filterCategory, filterStock, filterFeatured]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  const handleDelete = async (product: Product) => {
    const ok = await confirm({
      title: 'Delete product',
      message: `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteProduct(product.id);
      toast.success('Product deleted');
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (pageItems.every(p => selected.has(p.id))) {
      const next = new Set(selected);
      pageItems.forEach(p => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      pageItems.forEach(p => next.add(p.id));
      setSelected(next);
    }
  };

  const handleBulk = async (action: 'delete' | 'feature' | 'activate') => {
    if (selected.size === 0) return;
    const ok = await confirm({
      title: `Bulk ${action}`,
      message: `Apply "${action}" to ${selected.size} product(s)?`,
      confirmText: action === 'delete' ? 'Delete all' : 'Apply',
      danger: action === 'delete',
    });
    if (!ok) return;
    try {
      const value = action === 'feature' ? true : action === 'activate' ? true : undefined;
      await adminApi.bulkProducts({ ids: Array.from(selected), action, value });
      toast.success('Bulk action completed');
      setSelected(new Set());
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk action failed');
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      label: 'Product',
      render: p => (
        <Link to={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 hover:underline min-w-0">
          <div className="w-12 h-12 rounded-lg bg-ink-100 overflow-hidden shrink-0">
            {p.images[0] && (
              <img
                src={p.images[0]}
                alt=""
                loading="lazy"
                onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{p.name}</p>
            <p className="text-sm text-ink-500 truncate">{p.brand}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: p => <span className="capitalize">{p.category?.name || p.categorySlug}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      render: p => (
        <div>
          <span className="font-semibold">{formatPrice(p.price)}</span>
          {p.compareAtPrice && (
            <span className="text-sm text-ink-400 line-through ml-2">{formatPrice(p.compareAtPrice)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: p => (
        <span className={cn(
          'font-medium',
          p.stock === 0 && 'text-red-600',
          p.stock > 0 && p.stock < 5 && 'text-orange-600'
        )}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'badges',
      label: 'Status',
      render: p => (
        <div className="flex flex-wrap gap-1">
          {p.featured && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          )}
          {p.isActive === false && (
            <span className="px-2 py-0.5 bg-ink-200 text-ink-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
              <EyeOff className="w-3 h-3" />
              Hidden
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: p => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/product/${p.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-ink-100 rounded-lg"
            aria-label="View"
            title="View in storefront"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/admin/products/${p.id}/edit`}
            className="p-2 hover:bg-ink-100 rounded-lg"
            aria-label="Edit"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(p)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (p: Product, isSelected: boolean) => (
    <div className={cn(
      'bg-white border rounded-2xl p-3 flex gap-3',
      isSelected ? 'border-brand-500 bg-brand-50' : 'border-ink-200'
    )}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleRow(p.id)}
        className="w-5 h-5 mt-1 shrink-0"
        aria-label={`Select ${p.name}`}
      />
      <Link to={`/admin/products/${p.id}/edit`} className="shrink-0">
        <div className="w-16 h-16 rounded-xl bg-ink-100 overflow-hidden">
          {p.images[0] && (
            <img
              src={p.images[0]}
              alt=""
              loading="lazy"
              onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/admin/products/${p.id}/edit`} className="block">
          <p className="font-semibold truncate">{p.name}</p>
          <p className="text-xs text-ink-500 truncate">{p.brand || '—'}</p>
        </Link>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">{formatPrice(p.price)}</span>
          <span className={cn(
            'text-xs font-medium',
            p.stock === 0 && 'text-red-600',
            p.stock > 0 && p.stock < 5 && 'text-orange-600',
            p.stock >= 5 && 'text-ink-500'
          )}>
            {p.stock} in stock
          </span>
          {p.featured && (
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold">Featured</span>
          )}
          {p.isActive === false && (
            <span className="px-1.5 py-0.5 bg-ink-200 text-ink-700 rounded-full text-[10px] font-semibold">Hidden</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Link
          to={`/admin/products/${p.id}/edit`}
          className="p-2.5 hover:bg-ink-100 rounded-lg"
          aria-label="Edit"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button
          onClick={() => handleDelete(p)}
          className="p-2.5 hover:bg-red-50 text-red-600 rounded-lg"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={`${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
        actions={
          <Link to="/admin/products/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add product
          </Link>
        }
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or brand…"
            className="input-base py-2 w-full sm:w-64"
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-base py-2 w-full sm:w-auto"
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value as any)}
            className="input-base py-2 w-full sm:w-auto"
          >
            <option value="all">All stock</option>
            <option value="low">Low stock (&lt;5)</option>
            <option value="out">Out of stock</option>
          </select>
          <select
            value={filterFeatured}
            onChange={e => setFilterFeatured(e.target.value as any)}
            className="input-base py-2 w-full sm:w-auto"
          >
            <option value="all">All</option>
            <option value="yes">Featured only</option>
            <option value="no">Not featured</option>
          </select>
        </div>

        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <button onClick={() => handleBulk('feature')} className="btn-ghost text-xs">
              Feature
            </button>
            <button onClick={() => handleBulk('activate')} className="btn-ghost text-xs">
              Activate
            </button>
            <button onClick={() => handleBulk('delete')} className="btn-ghost text-xs text-red-600">
              Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-ink-500 hover:text-ink-900">
              Clear
            </button>
          </div>
        )}
      </AdminPageHeader>

      <DataTable
        rows={pageItems}
        columns={columns}
        rowKey={p => p.id}
        selectable
        selected={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        loading={loading}
        emptyMessage="No products match your filters"
        renderMobileCard={renderMobileCard}
      />

      <Pagination page={page} totalPages={Math.max(totalPages, 1)} onPage={setPage} />
    </div>
  );
}