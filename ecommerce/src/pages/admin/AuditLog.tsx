import { useEffect, useState } from 'react';
import { adminApi, type AuditLogEntry } from '../../lib/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useDebounce } from '../../hooks/useDebounce';
import { History } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  'product.create': 'bg-green-100 text-green-700',
  'product.update': 'bg-blue-100 text-blue-700',
  'product.delete': 'bg-red-100 text-red-700',
  'product.bulk.delete': 'bg-red-100 text-red-700',
  'product.bulk.feature': 'bg-blue-100 text-blue-700',
  'product.bulk.activate': 'bg-blue-100 text-blue-700',
  'product.bulk.category': 'bg-blue-100 text-blue-700',
  'category.create': 'bg-green-100 text-green-700',
  'category.update': 'bg-blue-100 text-blue-700',
  'category.delete': 'bg-red-100 text-red-700',
  'order.update': 'bg-blue-100 text-blue-700',
  'user.update': 'bg-blue-100 text-blue-700',
  'promotion.create': 'bg-green-100 text-green-700',
  'promotion.update': 'bg-blue-100 text-blue-700',
  'promotion.delete': 'bg-red-100 text-red-700',
  'review.update': 'bg-blue-100 text-blue-700',
  'review.delete': 'bg-red-100 text-red-700',
  'settings.update': 'bg-purple-100 text-purple-700',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const debounced = useDebounce(actionFilter, 300);

  useEffect(() => {
    adminApi.getAudit({ action: debounced || undefined, limit: 200 })
      .then(res => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div>
      <AdminPageHeader title="Audit Log" description="Admin activity history">
        <input
          type="text"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          placeholder="Filter by action…"
          className="input-base py-2 w-full sm:w-64"
        />
      </AdminPageHeader>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-ink-200">
          <History className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No audit entries</p>
        </div>
      ) : (
        <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-100 text-sm">
              <tr>
                <th className="text-left p-4 font-semibold">When</th>
                <th className="text-left p-4 font-semibold">Who</th>
                <th className="text-left p-4 font-semibold">Action</th>
                <th className="text-left p-4 font-semibold">Resource</th>
                <th className="text-left p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t border-ink-100 hover:bg-ink-50">
                  <td className="p-4 text-sm text-ink-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm">{log.userEmail || 'system'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${ACTION_COLORS[log.action] || 'bg-ink-100 text-ink-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {log.resourceType && (
                      <span className="text-ink-700">
                        {log.resourceType}
                        {log.resourceId && <span className="text-ink-400 font-mono text-xs ml-1">{log.resourceId.slice(0, 8)}</span>}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-ink-500 max-w-xs truncate">
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <code>{JSON.stringify(log.metadata)}</code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}