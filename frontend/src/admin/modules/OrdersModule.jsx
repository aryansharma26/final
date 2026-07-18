import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Edit2,
  Eye,
  Loader2,
  ShoppingCart,
  Printer,
  Copy,
  Clock,
  CheckCircle,
  Truck,
  FileText,
  Calendar,
  AlertTriangle,
  User,
  CreditCard,
  Download
} from 'lucide-react';
import { adminAPI, orderAPI } from '../../api/index.js';
import { Badge, Button, Select, Modal, EmptyState, SkeletonRow, Textarea } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const formatMoney = (value = 0) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');
const shortId = (id = '') => `#${String(id).slice(-6).toUpperCase()}`;

const getOrderSummary = (order) => {
  const firstItem = order.orderItems?.[0];
  const itemCount = order.orderItems?.length || 0;
  const name = firstItem?.name || firstItem?.product?.name || 'Order item';
  return itemCount > 1 ? `${name} + ${itemCount - 1} more` : name;
};

const getImage = (image) => (typeof image === 'string' ? image : image?.url || '');

const orderStatusTheme = {
  pending: {
    badge: 'yellow',
    row: 'bg-yellow-50/45 hover:bg-yellow-50',
    border: 'border-l-yellow-400',
    dot: 'bg-yellow-500',
  },
  confirmed: {
    badge: 'blue',
    row: 'bg-blue-50/40 hover:bg-blue-50',
    border: 'border-l-blue-400',
    dot: 'bg-blue-500',
  },
  packed: {
    badge: 'purple',
    row: 'bg-purple-50/40 hover:bg-purple-50',
    border: 'border-l-purple-400',
    dot: 'bg-purple-500',
  },
  shipped: {
    badge: 'orange',
    row: 'bg-orange-50/45 hover:bg-orange-50',
    border: 'border-l-orange-400',
    dot: 'bg-orange-500',
  },
  delivered: {
    badge: 'green',
    row: 'bg-green-50/55 hover:bg-green-50',
    border: 'border-l-green-500',
    dot: 'bg-green-600',
  },
  cancelled: {
    badge: 'red',
    row: 'bg-red-50/50 hover:bg-red-50',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
  },
};

const getOrderStatusTheme = (status) => orderStatusTheme[status] || {
  badge: 'gray',
  row: 'bg-white hover:bg-gray-50/50',
  border: 'border-l-gray-200',
  dot: 'bg-gray-400',
};

const OrdersModule = ({ defaultTypeFilter = 'all', hideTypeFilter = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState(defaultTypeFilter);
  const [viewOrder, setViewOrder] = useState(null);
  const [updateId, setUpdateId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setOrderTypeFilter(defaultTypeFilter);
    setPage(1);
  }, [defaultTypeFilter]);

  const loadOrders = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (orderTypeFilter === 'b2b') params.isB2B = 'true';
      if (orderTypeFilter === 'b2c') params.isB2B = 'false';
      const { data } = await adminAPI.getAllOrders(params);
      const nextOrders = data.orders || [];
      setOrders((prev) => (append ? [...prev, ...nextOrders] : nextOrders));
      setPage(pageNum);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, orderTypeFilter]);

  useEffect(() => { loadOrders(1, false); }, [loadOrders]);

  const hasMore = page < totalPages;
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadOrders(page + 1, true);
  }, [hasMore, loading, loadOrders, page]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const filteredOrders = search
    ? orders.filter((o) =>
        o._id.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        o.shippingAddress?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.orderItems?.some((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
      )
    : orders;

  const handleUpdateStatus = async () => {
    if (!updateId || !newStatus) return;
    try {
      setUpdateLoading(true);
      await adminAPI.updateOrderStatus(updateId, { status: newStatus });
      setUpdateId(null);
      loadOrders(1, false);
      setMessage('Order status updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = { limit: 10000, export: 'true' };
      if (statusFilter) params.status = statusFilter;
      if (orderTypeFilter === 'b2b') params.isB2B = 'true';
      if (orderTypeFilter === 'b2c') params.isB2B = 'false';

      const { data } = await adminAPI.getAllOrders(params);
      const allOrders = data.orders || [];

      // Filter on search term client-side if a search filter is set
      const matchingOrders = search
        ? allOrders.filter((o) =>
            o._id.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            o.shippingAddress?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.orderItems?.some((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
          )
        : allOrders;

      const headers = [
        'Order ID',
        'Order Code',
        'Customer Name',
        'Email',
        'Phone',
        'Total Price',
        'Order Type',
        'Payment Method',
        'Paid Status',
        'Status',
        'Tracking Number',
        'Date'
      ];

      const mapper = (o) => [
        o._id,
        shortId(o._id),
        o.user?.name || 'Guest',
        o.user?.email || '',
        o.shippingAddress?.phone || '',
        o.totalPrice || 0,
        o.isPrescriptionOrder ? 'Prescription Order' : o.isB2B ? 'Business Purchase' : 'Retail Order',
        o.paymentMethod || '',
        o.isPaid ? 'Paid' : 'Unpaid',
        o.status || '',
        o.trackingNumber || '',
        o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
      ];

      await exportToExcel(matchingOrders, headers, mapper, 'orders_export', 'Orders');
    } catch (err) {
      console.error('Failed to export orders to excel:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const statusOptions = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {hideTypeFilter ? 'B2B Orders' : orderTypeFilter === 'b2c' ? 'Orders (B2C)' : orderTypeFilter === 'b2b' ? 'B2B Orders' : 'Orders'}
        </h1>
      </div>

      {message && <div className={`p-3 rounded-xl text-sm ${message.includes('updated') || message.includes('successfully') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      {/* Order Type Tabs (Separate B2B and B2C) */}
      {!hideTypeFilter && (
        <div className="flex border border-gray-150 gap-2 mb-4 bg-gray-50/50 p-1.5 rounded-xl max-w-lg">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'b2c', label: 'Standard (B2C) Orders' },
            { value: 'b2b', label: 'Wholesale (B2B) Orders' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setOrderTypeFilter(tab.value); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                orderTypeFilter === tab.value
                  ? 'bg-white text-brand shadow-sm font-bold border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Horizontal Status Filter Tabs */}
      <div className="flex border-b border-gray-150 gap-1 overflow-x-auto">
        {[{ value: '', label: 'All Statuses' }, ...statusOptions.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
              statusFilter === tab.value
                ? 'border-brand text-brand font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by order ID, customer name, email, product..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white" />
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exportLoading}
          className="pressable w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark focus:outline-none transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
        >
          {exportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Download className="w-4 h-4 text-white/80" />
          )}
          Export Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-550 font-medium">
              <tr>
                <th className="px-4 py-3 text-left">Order Details</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={7} />
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={ShoppingCart} title="No orders found" subtitle="Try adjusting your search or filters" /></td></tr>
              ) : (
                filteredOrders.map((o) => {
                  const theme = getOrderStatusTheme(o.status);
                  return (
                  <tr key={o._id} onClick={() => setViewOrder(o)} className={`pressable border-b border-l-4 border-gray-50 ${theme.border} ${theme.row} cursor-pointer transition-all animate-fadeIn`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title={`Order Code: ${shortId(o._id)} | Full Order ID: ${o._id}`}>
                          Order Code {shortId(o._id)}
                        </span>
                        {o.isB2B && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                            Business Purchase
                          </span>
                        )}
                        {o.isPrescriptionOrder && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                            Prescription Order
                          </span>
                        )}
                      </div>
                      <p className="max-w-[260px] truncate font-semibold text-gray-900 mt-1">{getOrderSummary(o)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {(o.orderItems || []).slice(0, 3).map((item, idx) => (
                            <img
                              key={idx}
                              src={item.image || getImage(item.product?.images?.[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop'}
                              alt=""
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover border border-gray-100"
                            />
                          ))}
                        </div>
                        {(o.orderItems || []).length > 3 && (
                          <span className="text-[10px] text-gray-400 font-semibold">+{(o.orderItems || []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand border border-brand/20">
                          {o.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[150px]">{o.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{o.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-950">{formatMoney(o.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                        <Badge color={theme.badge}>{o.status}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={o.isPaid ? 'green' : 'red'}>
                        {o.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                      <span className="block text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">{o.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-550 font-medium">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewOrder(o)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="View Invoice"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setUpdateId(o._id); setNewStatus(o.status); }} className="pressable p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Quick Status Edit"><Edit2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  );
                })
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

      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Invoice Receipt: ${viewOrder ? `Order Code ${shortId(viewOrder._id)}` : ''}`} maxWidth="max-w-4xl">
        {viewOrder && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Full Order ID</p>
                <p className="mb-3 font-mono text-xs font-semibold text-gray-600 break-all">{viewOrder._id}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Order Placement Date</p>
                <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(viewOrder.createdAt)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge color={viewOrder.isPaid ? 'green' : 'red'}>
                  {viewOrder.isPaid ? 'Paid' : 'Unpaid'}
                </Badge>
                <Badge color={getOrderStatusTheme(viewOrder.status).badge}>
                  {viewOrder.status}
                </Badge>
                {viewOrder.isB2B && (
                  <Badge color="blue">Business Purchase</Badge>
                )}
                {viewOrder.isPrescriptionOrder && (
                  <Badge color="yellow">Prescription Order</Badge>
                )}
              </div>
            </div>

            {/* Step Status Tracker */}
            {(() => {
              const steps = [
                { key: 'pending', label: 'Placed' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'packed', label: 'Packed' },
                { key: 'shipped', label: 'Shipped' },
                { key: 'delivered', label: 'Delivered' }
              ];
              const isCancelled = viewOrder.status === 'cancelled';
              const statusKeys = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
              const currentIndex = statusKeys.indexOf(viewOrder.status);
              return isCancelled ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-red-800">This order has been cancelled</p>
                    <p className="text-xs text-red-650">No further updates can be processed for this transaction.</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-br from-brand/5 to-white border border-brand/10 rounded-2xl">
                  <p className="text-[10px] text-brand/80 font-bold uppercase tracking-wider mb-4">Order Progress Tracker</p>
                  <div className="flex items-center justify-between relative px-4">
                    {/* Progress Line Background */}
                    <div className="absolute left-6 right-6 top-4 h-1 bg-gray-100 rounded-full z-0"></div>
                    {/* Active Progress Line */}
                    <div 
                      className="absolute left-6 top-4 h-1 bg-brand rounded-full z-0 transition-all duration-500"
                      style={{ width: `${currentIndex >= 0 ? (currentIndex / (statusKeys.length - 1)) * 88 : 0}%` }}
                    ></div>

                    {/* Step Nodes */}
                    {steps.map((step, idx) => {
                      const isCompleted = currentIndex >= idx;
                      const isActive = currentIndex === idx;
                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10 w-16">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-xs ${
                            isActive 
                              ? 'bg-brand text-white border-brand shadow-md scale-110' 
                              : isCompleted 
                                ? 'bg-brand text-white border-brand' 
                                : 'bg-white text-gray-400 border-gray-200'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold mt-2 whitespace-nowrap ${
                            isActive ? 'text-brand' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions (Direct Tracking / Status Update / Print Receipt) */}
            <div className="grid gap-4 sm:grid-cols-3 rounded-2xl bg-gray-50 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Update Order Status</span>
                <select
                  value={viewOrder.status}
                  onChange={async (e) => {
                    const status = e.target.value;
                    try {
                      setUpdateLoading(true);
                      await adminAPI.updateOrderStatus(viewOrder._id, { status });
                      setViewOrder(prev => ({ ...prev, status }));
                      loadOrders();
                      setMessage('Order status updated');
                      setTimeout(() => setMessage(''), 3000);
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to update status');
                    } finally {
                      setUpdateLoading(false);
                    }
                  }}
                  className="mt-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand font-medium text-gray-800"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Tracking Number</span>
                <input
                  type="text"
                  placeholder="Enter Tracking ID..."
                  defaultValue={viewOrder.trackingNumber || ''}
                  onBlur={async (e) => {
                    const tracking = e.target.value;
                    if (tracking === (viewOrder.trackingNumber || '')) return;
                    try {
                      await adminAPI.updateOrderStatus(viewOrder._id, { status: viewOrder.status, trackingNumber: tracking });
                      setViewOrder(prev => ({ ...prev, trackingNumber: tracking }));
                      loadOrders();
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to update tracking');
                    }
                  }}
                  className="mt-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand font-medium text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 h-[34px]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Receipt
                </Button>
              </div>
            </div>

            {/* Customer & Address Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-brand" />
                  <p className="text-xs font-bold text-gray-450 uppercase tracking-wider">Customer Details</p>
                </div>
                <p className="font-semibold text-gray-900">{viewOrder.user?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-505 mt-0.5">{viewOrder.user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">Payment Method: <span className="font-semibold text-gray-700 uppercase">{viewOrder.paymentMethod}</span></p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-brand" />
                  <p className="text-xs font-bold text-gray-455 uppercase tracking-wider">Shipping Address</p>
                </div>
                <p className="font-semibold text-gray-900">{viewOrder.shippingAddress?.name}</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {viewOrder.shippingAddress?.addressLine1}
                  {viewOrder.shippingAddress?.addressLine2 ? `, ${viewOrder.shippingAddress?.addressLine2}` : ''}
                  <br />
                  {viewOrder.shippingAddress?.barangay}, {viewOrder.shippingAddress?.cityMunicipality}
                  <br />
                  {viewOrder.shippingAddress?.province}, {viewOrder.shippingAddress?.zipCode}
                </p>
                {viewOrder.shippingAddress?.phone && (
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">Phone: {viewOrder.shippingAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Itemized Invoice Table */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-xs">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-450 uppercase tracking-wider">Itemized Breakdown</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-55/50 border-b border-gray-100 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.orderItems?.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/20">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src={item.image || getImage(item.product?.images?.[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop'}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover border border-gray-100"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[200px]">{item.name}</p>
                            {item.tierLabel && (
                              <span className="text-[10px] text-brand bg-brand/5 px-1 py-0.5 rounded font-semibold mt-0.5 inline-block">{item.tierLabel}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {item.originalPrice && item.originalPrice > item.price ? (
                            <div>
                              <span className="block text-[10px] text-gray-400 line-through">{formatMoney(item.originalPrice)}</span>
                              <span>{formatMoney(item.price)}</span>
                            </div>
                          ) : formatMoney(item.price)}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-950">{formatMoney(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Senior Citizen ID Verification Info */}
            {viewOrder.isSeniorCitizen && (
              <div className="mb-4 rounded-2xl border border-gray-150 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white font-bold text-[10px]">S</span>
                  <h3 className="text-sm font-bold text-gray-900">Senior Citizen ID Verification</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Verification Status: 
                      <span className={`ml-1.5 font-bold uppercase ${
                        viewOrder.seniorCitizenStatus === 'approved' ? 'text-green-600' :
                        viewOrder.seniorCitizenStatus === 'rejected' ? 'text-red-600' : 'text-amber-500'
                      }`}>
                        {viewOrder.seniorCitizenStatus || 'pending'}
                      </span>
                    </p>
                    {viewOrder.seniorCitizenIdDoc && (
                      <a 
                        href={viewOrder.seniorCitizenIdDoc} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-1 inline-block text-brand font-semibold hover:underline"
                      >
                        View Uploaded ID Document →
                      </a>
                    )}
                  </div>
                  {viewOrder.seniorCitizenStatus === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        className="pressable px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                        onClick={async () => {
                          if (!confirm('Approve this Senior Citizen verification?')) return;
                          try {
                            const { data } = await orderAPI.verifySeniorCitizenDoc(viewOrder._id, { status: 'approved' });
                            setViewOrder(data.order);
                            loadOrders();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to verify');
                          }
                        }}
                      >
                        Approve ID
                      </button>
                      <button 
                        className="pressable px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                        onClick={async () => {
                          if (!confirm('Reject this Senior Citizen verification?')) return;
                          try {
                            const { data } = await orderAPI.verifySeniorCitizenDoc(viewOrder._id, { status: 'rejected' });
                            setViewOrder(data.order);
                            loadOrders();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to reject');
                          }
                        }}
                      >
                        Reject ID
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Calculations & Invoice Totals Breakdown */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Order Notes Field */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-brand" />
                  <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">Internal Administrative Notes</label>
                </div>
                <Textarea
                  placeholder="Add administrative notes about this order..."
                  defaultValue={viewOrder.notes || ''}
                  onBlur={async (e) => {
                    const notes = e.target.value;
                    if (notes === (viewOrder.notes || '')) return;
                    try {
                      await adminAPI.updateOrderStatus(viewOrder._id, { status: viewOrder.status, notes });
                      setViewOrder(prev => ({ ...prev, notes }));
                      loadOrders();
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to update notes');
                    }
                  }}
                  rows={3}
                />
              </div>

              {/* Pricing Totals Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Items Subtotal</span>
                  <span className="font-semibold">{formatMoney(viewOrder.itemsPrice || viewOrder.totalPrice - viewOrder.shippingPrice - viewOrder.taxPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping Fee</span>
                  <span className="font-semibold">{formatMoney(viewOrder.shippingPrice || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (VAT)</span>
                  <span className="font-semibold">{formatMoney(viewOrder.taxPrice || 0)}</span>
                </div>
                {viewOrder.couponDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Coupon Discount</span>
                    <span className="font-semibold">-{formatMoney(viewOrder.couponDiscount)}</span>
                  </div>
                )}
                {viewOrder.seniorDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Senior Citizen Discount (20%)</span>
                    <span className="font-semibold">-{formatMoney(viewOrder.seniorDiscount)}</span>
                  </div>
                )}
                {viewOrder.checkoutOfferDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Checkout Offer Discount</span>
                    <span className="font-semibold">-{formatMoney(viewOrder.checkoutOfferDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-950">
                  <span className="text-base font-bold text-gray-900">Total Price</span>
                  <span className="text-base font-bold text-brand">{formatMoney(viewOrder.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!updateId} onClose={() => setUpdateId(null)} title="Update Order Status" maxWidth="max-w-md">
        <Select label="New Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} options={statusOptions.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setUpdateId(null)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} disabled={updateLoading}>
            {updateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Status'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersModule;
