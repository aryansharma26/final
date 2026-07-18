import { useState, useEffect, useCallback } from 'react';
import { Search, Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { adminAPI } from '../../api/index.js';
import { Badge, EmptyState, SkeletonRow, ConfirmDialog } from '../components/AdminUI.jsx';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const ReviewsModule = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadReviews = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getAllReviews({ page: pageNum, limit: 20 });
      const nextReviews = data.reviews || [];
      setReviews((prev) => (append ? [...prev, ...nextReviews] : nextReviews));
      setPage(pageNum);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReviews(1, false); }, [loadReviews]);

  const hasMore = page < totalPages;
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadReviews(page + 1, true);
  }, [hasMore, loading, loadReviews, page]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const filteredReviews = search
    ? reviews.filter((r) =>
        r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.comment?.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  const handleToggleApproval = async (review) => {
    try {
      await adminAPI.toggleReviewApproval(review._id);
      loadReviews(1, false);
      setMessage('Review approval updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await adminAPI.deleteReview(deleteId);
      setDeleteId(null);
      loadReviews(1, false);
      setMessage('Review deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
      </div>

      {message && <div className={`p-3 rounded-xl text-sm ${message.includes('updated') || message.includes('deleted') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by product, user, or comment..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Comment</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={6} />
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Star} title="No reviews found" subtitle="Try adjusting your search" /></td></tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{r.product?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{r.user?.name || r.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{r.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs line-clamp-2">{r.comment}</td>
                    <td className="px-4 py-3"><Badge color={r.isApproved ? 'green' : 'yellow'}>{r.isApproved ? 'Approved' : 'Pending'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleApproval(r)} className="pressable p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title={r.isApproved ? 'Reject' : 'Approve'}>
                          {r.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setDeleteId(r._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {(hasMore || loading) && (
          <div ref={loadMoreRef} className="flex min-h-14 items-center justify-center gap-2 border-t border-gray-100 p-4 text-sm text-gray-500">
            {loading ? 'Loading more...' : 'Scroll to load more'}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Review" message="Are you sure you want to delete this review?" loading={deleteLoading} />
    </div>
  );
};

export default ReviewsModule;
