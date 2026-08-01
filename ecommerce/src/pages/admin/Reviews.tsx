import { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, Send } from 'lucide-react';
import { adminApi, type Review } from '../../lib/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../components/admin/Toast';
import { useConfirm } from '../../components/admin/ConfirmDialog';

const TABS = ['pending', 'approved', 'rejected', 'all'] as const;

export default function Reviews() {
  const toast = useToast();
  const confirm = useConfirm();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>('pending');
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const load = (status: typeof TABS[number]) => {
    setLoading(true);
    adminApi.getReviews(status)
      .then(res => setReviews(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  const updateStatus = async (review: Review, status: string) => {
    try {
      await adminApi.updateReview(review.id, { status });
      toast.success(`Review ${status}`);
      load(tab);
    } catch (err: any) {
      toast.error('Update failed');
    }
  };

  const sendReply = async (review: Review) => {
    const reply = replyText[review.id] ?? review.reply ?? '';
    if (!reply.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    try {
      await adminApi.updateReview(review.id, { reply });
      toast.success('Reply saved');
      load(tab);
    } catch (err: any) {
      toast.error('Reply failed');
    }
  };

  const handleDelete = async (review: Review) => {
    const ok = await confirm({
      title: 'Delete review',
      message: 'Delete this review permanently?',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteReview(review.id);
      toast.success('Review deleted');
      load(tab);
    } catch (err: any) {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Reviews" description="Customer reviews moderation" />

      <div className="mb-4 flex gap-2 border-b border-ink-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-ink-200">
          <Star className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No reviews in this tab</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-ink-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {r.product?.images?.[0] && (
                    <img
                      src={r.product.images[0]}
                      alt=""
                      loading="lazy"
                      onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                      className="w-12 h-12 rounded-lg object-cover bg-ink-100 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.product?.name || 'Unknown product'}</p>
                    <p className="text-sm text-ink-500">
                      by {r.user?.name || 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-ink-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize shrink-0 ${
                  r.status === 'approved' ? 'bg-green-100 text-green-700' :
                  r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {r.status}
                </span>
              </div>
              {(r.title || r.body) && (
                <div className="mt-3 ml-[60px]">
                  {r.title && <p className="font-semibold">{r.title}</p>}
                  {r.body && <p className="text-sm text-ink-700 mt-1">{r.body}</p>}
                </div>
              )}
              {r.reply && (
                <div className="mt-3 ml-[60px] p-3 bg-ink-100 rounded-xl text-sm">
                  <p className="text-xs text-ink-500 mb-1">Your reply:</p>
                  <p>{r.reply}</p>
                </div>
              )}
              <div className="mt-4 ml-[60px] flex flex-wrap items-center gap-2">
                {r.status !== 'approved' && (
                  <button onClick={() => updateStatus(r, 'approved')} className="btn-secondary text-sm flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => updateStatus(r, 'rejected')} className="btn-secondary text-sm flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                <button onClick={() => handleDelete(r)} className="btn-secondary text-sm text-red-600 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <div className="flex-1" />
                <input
                  type="text"
                  value={replyText[r.id] ?? r.reply ?? ''}
                  onChange={e => setReplyText({ ...replyText, [r.id]: e.target.value })}
                  placeholder="Write a reply…"
                  className="input-base py-1.5 text-sm w-48"
                />
                <button onClick={() => sendReply(r)} className="btn-ghost text-sm flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}