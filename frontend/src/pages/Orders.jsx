import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, ArrowLeft, Clock, Truck, CheckCircle, XCircle, ChevronRight, RotateCw, Building2, FileText } from 'lucide-react';
import { orderAPI } from '../api/index.js';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-brand/10 text-brand border-brand/20', icon: CheckCircle },
  packed: { label: 'Packed', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
};

const getOrderItemImage = (item) => {
  if (!item) return '';
  if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) return item.image;
  if (item.product?.images?.length) {
    const img = item.product.images[0];
    return typeof img === 'string' ? img : img?.url || '';
  }
  return '';
};

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await orderAPI.getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrders([]);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-6 sm:py-8">
        <div className="mb-6 h-10 w-44 animate-pulse rounded-xl bg-gray-100" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100 sm:h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-5 sm:py-8">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-0.5 rounded-xl p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Account</p>
            <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">{orders.length} order{orders.length === 1 ? '' : 's'} in your account</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-brand/30 hover:text-brand"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex min-h-[34vh] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-5 py-8 text-center sm:min-h-[42vh] sm:py-12">
          <Package className="mb-4 h-14 w-14 text-gray-300 sm:mb-5 sm:h-16 sm:w-16" />
          <h2 className="mb-2 text-xl font-bold text-gray-950 sm:text-2xl">No Orders Yet</h2>
          <p className="mb-5 max-w-sm text-sm text-gray-500 sm:mb-7">When you place an order, tracking and payment details will appear here.</p>
          <Link to="/medicines" className="pressable inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3 font-semibold text-white transition-colors hover:bg-brand-dark">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => {
            const firstItem = order.orderItems?.[0];
            const itemCount = order.orderItems?.length || 0;
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const productImage = getOrderItemImage(firstItem) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop';
            const productName = firstItem?.name || firstItem?.product?.name || 'Product';
            const orderTitle = itemCount > 1 ? `${productName} + ${itemCount - 1} more` : productName;
            const orderLink = `/orders/${order._id}`;

            return (
              <div
                key={order._id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(orderLink)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(orderLink);
                  }
                }}
                className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="mb-4 flex flex-col gap-2 border-b border-gray-50 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-950 sm:text-base">{orderTitle}</p>
                      {order.isB2B && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <Building2 className="h-3 w-3" /> Business Purchase
                        </span>
                      )}
                      {order.isPrescriptionOrder && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <FileText className="h-3 w-3" /> Prescription Order
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </div>

                <div className="flex gap-3 sm:items-center sm:gap-4">
                  <Link to={orderLink} className="pressable h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition-opacity hover:opacity-80 sm:h-24 sm:w-24">
                    <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={orderLink} className="pressable line-clamp-2 text-sm font-semibold text-gray-950 transition-colors hover:text-brand sm:text-base">
                      {productName}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">
                      {firstItem?.quantity > 1 ? `Qty: ${firstItem.quantity}` : 'Qty: 1'}
                      {itemCount > 1 ? ` and ${itemCount - 1} more item${itemCount > 2 ? 's' : ''}` : ''}
                    </p>
                    <Link
                      to={`/orders/${order._id}`}
                      className="pressable mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                    >
                      View Details <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-lg font-bold text-gray-950">{formatMoney(order.totalPrice)}</p>
                    <p className="text-xs text-gray-400">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 sm:hidden">
                  <span className="text-xs font-medium text-gray-500">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                  <span className="text-sm font-bold text-gray-950">{formatMoney(order.totalPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
