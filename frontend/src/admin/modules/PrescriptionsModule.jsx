import { useCallback, useEffect, useState } from 'react';
import { Download, Edit2, Eye, FileText, Loader2, Plus, Search, Trash2, Pill, Send, X } from 'lucide-react';
import { adminAPI, prescriptionAPI } from '../../api/index.js';
import { Badge, Button, ConfirmDialog, EmptyState, Modal, Select, SkeletonRow, Textarea } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusColor = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const formatDeliveryAddress = (address = {}) => [
  address.addressLine1,
  address.addressLine2,
  address.barangay,
  address.cityMunicipality,
  address.province,
  address.zipCode,
].filter(Boolean).join(', ');

const PrescriptionsModule = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [quoteItem, setQuoteItem] = useState(null);
  const [quoteRows, setQuoteRows] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteProducts, setQuoteProducts] = useState([]);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = { limit: 10000, export: 'true' };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      
      const { data } = await prescriptionAPI.getAllPrescriptions(params);
      const allPrescriptions = data.prescriptions || [];

      const headers = [
        'Prescription ID',
        'Customer Name',
        'Email',
        'Phone',
        'Requested Product',
        'Delivery Name',
        'Delivery Phone',
        'Delivery Address',
        'Status',
        'Notes',
        'Upload Date'
      ];

      const mapper = (p) => [
        p._id,
        p.user?.name || 'Guest',
        p.user?.email || '',
        p.user?.phone || '',
        p.requestedProduct?.name || 'N/A',
        p.deliveryAddress?.name || '',
        p.deliveryAddress?.phone || '',
        formatDeliveryAddress(p.deliveryAddress),
        p.status || 'pending',
        p.adminNotes || '',
        p.uploadedAt ? new Date(p.uploadedAt).toLocaleString() : ''
      ];

      await exportToExcel(allPrescriptions, headers, mapper, 'prescriptions_export', 'Prescriptions');
    } catch (err) {
      console.error('Failed to export prescriptions:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const loadPrescriptions = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const [listRes, statsRes] = await Promise.all([
        prescriptionAPI.getAllPrescriptions(params),
        prescriptionAPI.getPrescriptionStats(),
      ]);
      const nextPrescriptions = listRes.data.prescriptions || [];
      setPrescriptions((prev) => (append ? [...prev, ...nextPrescriptions] : nextPrescriptions));
      setPage(pageNum);
      setTotalPages(listRes.data.pagination?.pages || 1);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadPrescriptions(1, false);
  }, [loadPrescriptions]);

  const hasMore = page < totalPages;
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadPrescriptions(page + 1, true);
  }, [hasMore, loading, loadPrescriptions, page]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const openReview = (item) => {
    setReviewItem(item);
    setReviewStatus(item.status === 'rejected' ? 'rejected' : 'approved');
    setAdminNotes(item.adminNotes || '');
  };

  const getProductPrice = (product) => Number(product?.discountPrice > 0 ? product.discountPrice : product?.price || 0);

  const loadQuoteProducts = async () => {
    if (quoteProducts.length > 0) return quoteProducts;
    const { data } = await adminAPI.getAllProducts({ limit: 10000, status: 'active' });
    const products = data.products || [];
    setQuoteProducts(products);
    return products;
  };

  const openQuote = async (item) => {
    try {
      setQuoteLoading(true);
      const products = await loadQuoteProducts();
      const existingRows = (item.quoteItems || []).map((quoteItem) => ({
        product: quoteItem.product?._id || quoteItem.product,
        quantity: quoteItem.quantity || 1,
        price: quoteItem.price || getProductPrice(quoteItem.product),
      }));
      setQuoteRows(existingRows.length > 0 ? existingRows : [{ product: products[0]?._id || '', quantity: 1, price: getProductPrice(products[0]) }]);
      setQuoteNotes(item.quoteNotes || '');
      setQuoteItem(item);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to load products for quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const updateQuoteRow = (index, patch) => {
    setQuoteRows((rows) => rows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const next = { ...row, ...patch };
      if (patch.product) {
        const product = quoteProducts.find((item) => item._id === patch.product);
        next.price = getProductPrice(product);
      }
      return next;
    }));
  };

  const addQuoteRow = () => {
    const product = quoteProducts[0];
    setQuoteRows((rows) => [...rows, { product: product?._id || '', quantity: 1, price: getProductPrice(product) }]);
  };

  const removeQuoteRow = (index) => {
    setQuoteRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const saveQuote = async () => {
    if (!quoteItem) return;
    const items = quoteRows
      .filter((row) => row.product)
      .map((row) => ({ product: row.product, quantity: Number(row.quantity || 1), price: Number(row.price || 0) }));
    if (items.length === 0) {
      showMessage('Add at least one product to send a quote');
      return;
    }
    try {
      setQuoteLoading(true);
      const { data } = await prescriptionAPI.updatePrescriptionQuote(quoteItem._id, { items, quoteNotes });
      setQuoteItem(null);
      setQuoteRows([]);
      setQuoteNotes('');
      showMessage(data.message || 'Quote sent');
      await loadPrescriptions(1, false);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to send quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewItem) return;
    try {
      setReviewLoading(true);
      const { data } = await prescriptionAPI.reviewPrescription(reviewItem._id, { status: reviewStatus, adminNotes });
      setReviewItem(null);
      showMessage(data.message || `Prescription ${reviewStatus}`);
      await loadPrescriptions(1, false);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to review prescription');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await prescriptionAPI.deletePrescription(deleteId);
      setDeleteId(null);
      showMessage('Prescription deleted successfully');
      await loadPrescriptions(1, false);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete prescription');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      setDownloadingId(item._id);
      const response = await prescriptionAPI.downloadPrescription(item._id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.originalFileName || 'prescription';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to download prescription');
    } finally {
      setDownloadingId(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewItem(null);
  };

  const handleView = async (item) => {
    try {
      setViewingId(item._id);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const response = await prescriptionAPI.viewPrescription(item._id);
      const blob = new Blob([response.data], { type: item.fileType || response.headers?.['content-type'] || 'application/octet-stream' });
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewItem(item);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to view prescription');
    } finally {
      setViewingId(null);
    }
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="mt-1 text-sm text-gray-500">Review customer uploads and approve eligible prescription orders.</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Total', stats.total, 'gray'],
            ['Pending', stats.pending, 'yellow'],
            ['Approved', stats.approved, 'green'],
            ['Rejected', stats.rejected, 'red'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : 'text-gray-900'}`}>{value || 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={statusOptions}
        />
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exportLoading}
          className="pressable inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark focus:outline-none transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer h-[38px] sm:h-auto"
        >
          {exportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Download className="w-4 h-4 text-white/80" />
          )}
          Export Excel
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Requested Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">File</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Delivery</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={7} count={4} />
              ) : prescriptions.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={FileText} title="No prescriptions found" subtitle="Try changing the status filter or search." /></td></tr>
              ) : (
                prescriptions.map((item) => (
                  <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">{item.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{item.user?.email}</p>
                      {item.user?.phone && <p className="text-xs text-brand font-medium mt-0.5">{item.user.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {item.requestedProduct ? (
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-brand" />
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{item.requestedProduct.name}</p>
                            <p className="text-[10px] text-gray-500">{item.requestedProduct.brand}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[200px] truncate font-medium text-gray-900 text-xs">{item.originalFileName}</p>
                      <p className="text-[10px] text-gray-500">{item.fileType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-900">{item.deliveryAddress?.name || item.user?.name || '-'}</p>
                      <p className="text-[11px] text-gray-500">{item.deliveryAddress?.phone || item.user?.phone || '-'}</p>
                      <p className="max-w-[220px] truncate text-[11px] text-gray-400" title={formatDeliveryAddress(item.deliveryAddress)}>
                        {formatDeliveryAddress(item.deliveryAddress) || 'No delivery address'}
                      </p>
                    </td>
                    <td className="px-4 py-3"><Badge color={statusColor[item.status] || 'gray'}>{item.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.uploadedAt || item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(item)} className="pressable rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand/10 hover:text-brand" title="View">
                          {viewingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleDownload(item)} className="pressable rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Download">
                          {downloadingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openReview(item)} className="pressable rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Review"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => openQuote(item)} className="pressable rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600" title="Send Product Quote">
                          {quoteLoading && quoteItem?._id === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setDeleteId(item._id)} className="pressable rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              'Scroll to load more'
            )}
          </div>
        )}
      </div>

      <Modal open={!!reviewItem} onClose={() => setReviewItem(null)} title="Review Prescription" maxWidth="max-w-lg">
        <div className="space-y-4">
          {reviewItem && (
            <div className="rounded-xl bg-gray-50 p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">{reviewItem.originalFileName}</p>
                <p className="mt-1 text-sm text-gray-500">{reviewItem.user?.name} | {reviewItem.user?.email}</p>
              </div>
              {reviewItem.requestedProduct && (
                <div className="rounded-lg bg-brand/5 border border-brand/10 p-3">
                  <p className="text-xs font-semibold text-brand uppercase tracking-wider">Requested Product</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-brand" />
                    <span className="font-medium text-sm text-gray-900">{reviewItem.requestedProduct.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{reviewItem.requestedProduct.brand}</p>
                </div>
              )}
              {formatDeliveryAddress(reviewItem.deliveryAddress) && (
                <div className="rounded-lg bg-white border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Address</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{reviewItem.deliveryAddress?.name || reviewItem.user?.name}</p>
                  <p className="text-xs text-gray-600">{reviewItem.deliveryAddress?.phone || reviewItem.user?.phone}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{formatDeliveryAddress(reviewItem.deliveryAddress)}</p>
                </div>
              )}
            </div>
          )}
          <Select
            label="Review Status"
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value)}
            options={[
              { value: 'approved', label: 'Approve' },
              { value: 'rejected', label: 'Reject' },
            ]}
          />
          <Textarea label="Admin Notes (visible to user if rejected)" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReviewItem(null)}>Cancel</Button>
          <Button onClick={handleReview} disabled={reviewLoading}>
            {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Review'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!quoteItem} onClose={() => setQuoteItem(null)} title="Send Medicine Quote" maxWidth="max-w-3xl">
        {quoteItem && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{quoteItem.user?.name || 'Customer'}</p>
              <p className="mt-1 text-sm text-gray-500">{quoteItem.originalFileName}</p>
              {formatDeliveryAddress(quoteItem.deliveryAddress) && (
                <p className="mt-2 text-xs text-gray-600">Deliver to: {formatDeliveryAddress(quoteItem.deliveryAddress)}</p>
              )}
            </div>

            <div className="space-y-3">
              {quoteRows.map((row, index) => {
                const selectedProduct = quoteProducts.find((product) => product._id === row.product);
                return (
                  <div key={`${row.product}-${index}`} className="grid gap-2 rounded-2xl border border-gray-100 bg-white p-3 sm:grid-cols-[1fr_90px_120px_auto] sm:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">Product</label>
                      <select
                        value={row.product}
                        onChange={(event) => updateQuoteRow(index, { product: event.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="">Select product</option>
                        {quoteProducts.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.stock ?? 0} in stock)
                          </option>
                        ))}
                      </select>
                      {selectedProduct && <p className="mt-1 text-[11px] text-gray-400">{selectedProduct.brand || 'No brand'}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(event) => updateQuoteRow(index, { quantity: event.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">Price</label>
                      <input
                        type="number"
                        min="0"
                        value={row.price}
                        onChange={(event) => updateQuoteRow(index, { price: event.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuoteRow(index)}
                      className="inline-flex h-10 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove product"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={addQuoteRow} className="pressable inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand/30 hover:text-brand">
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </button>

            <Textarea label="Quote Notes" value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} rows={3} />

            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              This quote will appear on the customer's prescription page. They can place the order from there.
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setQuoteItem(null)}>Cancel</Button>
          <Button onClick={saveQuote} disabled={quoteLoading}>
            {quoteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Quote
          </Button>
        </div>
      </Modal>

      <Modal open={!!previewItem} onClose={closePreview} title="View Prescription" maxWidth="max-w-4xl">
        {previewItem && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{previewItem.originalFileName}</p>
              <p className="mt-1 text-sm text-gray-500">
                {previewItem.user?.name || 'Unknown'} | {previewItem.fileType}
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              {previewItem.fileType === 'application/pdf' ? (
                <iframe src={previewUrl} title="Prescription PDF" className="h-[70vh] w-full bg-white" />
              ) : (
                <img src={previewUrl} alt="Prescription preview" className="max-h-[70vh] w-full object-contain" />
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closePreview}>Close</Button>
              <Button onClick={() => handleDownload(previewItem)}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Prescription" message="Are you sure you want to delete this prescription file and record?" loading={deleteLoading} />
    </div>
  );
};

export default PrescriptionsModule;
