import { useEffect, useMemo, useState } from 'react';
import { X, Mail, MapPin, ShoppingCart, Ban, CheckCircle } from 'lucide-react';
import { adminApi, type User, type Order } from '../../lib/api';
import DataTable, { type Column } from '../../components/admin/DataTable';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../components/admin/Toast';
import { useConfirm } from '../../components/admin/ConfirmDialog';
import { cn } from '../../lib/utils';

export default function Users() {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'disabled'>('all');
  const [selectedUser, setSelectedUser] = useState<{ user: User; lifetimeValue: number } | null>(null);

  const loadUsers = () => {
    adminApi.getUsers()
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    let res = users;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      res = res.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filterRole !== 'all') res = res.filter(u => u.role === filterRole);
    if (filterActive === 'active') res = res.filter(u => u.isActive !== false);
    else if (filterActive === 'disabled') res = res.filter(u => u.isActive === false);
    return res;
  }, [users, debouncedSearch, filterRole, filterActive]);

  const toggleActive = async (user: User) => {
    const willBe = user.isActive === false;
    const ok = await confirm({
      title: willBe ? 'Enable account' : 'Disable account',
      message: willBe
        ? `Allow ${user.email} to sign in again?`
        : `Prevent ${user.email} from signing in? They can be re-enabled later.`,
      confirmText: willBe ? 'Enable' : 'Disable',
      danger: !willBe,
    });
    if (!ok) return;
    try {
      await adminApi.updateUser(user.id, { isActive: willBe });
      toast.success(willBe ? 'Account enabled' : 'Account disabled');
      loadUsers();
      if (selectedUser?.user.id === user.id) {
        setSelectedUser({ ...selectedUser, user: { ...user, isActive: willBe } });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const ok = await confirm({
      title: 'Change role',
      message: `Change ${user.email} from "${user.role}" to "${newRole}"?`,
    });
    if (!ok) return;
    try {
      await adminApi.updateUser(user.id, { role: newRole });
      toast.success('Role updated');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const openDetail = async (user: User) => {
    try {
      const res = await adminApi.getUser(user.id);
      setSelectedUser(res.data);
    } catch (err) {
      toast.error('Failed to load user details');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: u => (
        <button onClick={() => openDetail(u)} className="flex items-center gap-3 hover:underline text-left">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{u.name}</p>
            <p className="text-xs text-ink-500 truncate">{u.email}</p>
          </div>
        </button>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: u => (
        <button
          onClick={() => toggleRole(u)}
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-ink-100 text-ink-700'
          }`}
          title="Click to toggle"
        >
          {u.role}
        </button>
      ),
    },
    {
      key: 'address',
      label: 'Location',
      render: u => (
        <span className="text-sm text-ink-500">
          {u.address && u.city ? `${u.city}, ${u.country || ''}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: u => (
        u.isActive === false ? (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
            <Ban className="w-3 h-3" />
            Disabled
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        )
      ),
    },
    {
      key: 'joined',
      label: 'Joined',
      render: u => (
        <span className="text-sm text-ink-500">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: u => (
        <button
          onClick={() => toggleActive(u)}
          className="p-2 hover:bg-ink-100 rounded-lg"
          aria-label={u.isActive === false ? 'Enable' : 'Disable'}
          title={u.isActive === false ? 'Enable' : 'Disable'}
        >
          {u.isActive === false ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Ban className="w-4 h-4 text-red-600" />}
        </button>
      ),
    },
  ];

  const renderMobileCard = (u: User) => (
    <button
      onClick={() => openDetail(u)}
      className="w-full text-left bg-white border border-ink-200 rounded-2xl p-4 active:bg-ink-50 transition-colors flex items-start gap-3"
    >
      <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-lg shrink-0">
        {u.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold truncate">{u.name}</p>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-ink-100 text-ink-700'
          }`}>
            {u.role}
          </span>
          {u.isActive === false ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Disabled</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Active</span>
          )}
        </div>
        <p className="text-xs text-ink-500 truncate mt-0.5">{u.email}</p>
        <p className="text-xs text-ink-400 mt-1">
          {u.address && u.city ? `${u.city}, ${u.country || ''}` : 'No address'} · Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
        </p>
      </div>
    </button>
  );

  return (
    <div>
      <AdminPageHeader title="Customers" description={`${users.length} customer${users.length === 1 ? '' : 's'}`}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input-base py-2 w-full sm:w-64"
          />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as any)}
            className="input-base py-2 w-full sm:w-auto"
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Customers</option>
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value as any)}
            className="input-base py-2 w-full sm:w-auto"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </AdminPageHeader>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={u => u.id}
        loading={loading}
        emptyMessage="No customers match"
        renderMobileCard={renderMobileCard}
      />

      {selectedUser && (
        <UserDetailDrawer
          data={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={(u) => setSelectedUser({ ...selectedUser, user: u })}
        />
      )}
    </div>
  );
}

function UserDetailDrawer({
  data,
  onClose,
  onUpdate,
}: {
  data: { user: User; lifetimeValue: number };
  onClose: () => void;
  onUpdate: (u: User) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const { user, lifetimeValue } = data;

  const toggleActive = async () => {
    const willBe = user.isActive === false;
    const ok = await confirm({
      title: willBe ? 'Enable account' : 'Disable account',
      message: willBe ? 'Allow this user to sign in?' : 'Block this user from signing in?',
      danger: !willBe,
    });
    if (!ok) return;
    try {
      await adminApi.updateUser(user.id, { isActive: willBe });
      toast.success(willBe ? 'Enabled' : 'Disabled');
      onUpdate({ ...user, isActive: willBe });
    } catch (err: any) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/50 flex justify-end" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold">Customer details</h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm text-ink-500">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-ink-100 text-ink-700'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ink-100 rounded-xl p-4">
              <p className="text-xs text-ink-500">Lifetime value</p>
              <p className="text-xl font-bold">${lifetimeValue.toFixed(2)}</p>
            </div>
            <div className="bg-ink-100 rounded-xl p-4">
              <p className="text-xs text-ink-500">Status</p>
              <p className="text-xl font-bold">
                {user.isActive === false ? 'Disabled' : 'Active'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </h3>
            {user.address && user.city ? (
              <p className="text-sm text-ink-500">
                {user.address}<br />
                {user.city}, {user.zipCode}<br />
                {user.country}
              </p>
            ) : (
              <p className="text-sm text-ink-400">No address on file</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Recent orders
            </h3>
            {(user as any).orders?.length ? (
              <div className="space-y-2">
                {((user as any).orders as Order[]).slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                    <span className="text-ink-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="font-semibold">${parseFloat(String(o.total)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No orders yet</p>
            )}
          </div>

          <div className="pt-4 border-t border-ink-200 space-y-2">
            <a
              href={`mailto:${user.email}`}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send email
            </a>
            <button
              onClick={toggleActive}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-full transition-all duration-200',
                user.isActive === false
                  ? 'bg-ink-900 text-white hover:bg-ink-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              {user.isActive === false ? 'Enable account' : 'Disable account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}