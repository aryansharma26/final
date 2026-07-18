import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Clock,
  ArrowRight,
  ShoppingBag,
  Building2
} from 'lucide-react';
import { Badge } from '../components/AdminUI.jsx';

const colorMap = {
  blue: 'bg-blue-50 text-blue-650 border border-blue-100',
  green: 'bg-green-50 text-green-650 border border-green-100',
  purple: 'bg-purple-50 text-purple-650 border border-purple-100',
  orange: 'bg-orange-50 text-orange-650 border border-orange-100',
};

const formatMoney = (value = 0) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatAxisMoney = (value = 0) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `PHP ${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`;
  if (amount >= 1000) return `PHP ${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
  return `PHP ${Math.round(amount)}`;
};

const getNiceMax = (value = 0) => {
  const raw = Math.max(Number(value || 0), 1);
  const exponent = Math.floor(Math.log10(raw));
  const magnitude = Math.pow(10, exponent);
  const normalized = raw / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
};

const getLastSixMonths = (monthlyRevenue = []) => {
  const revenueByMonth = new Map(
    monthlyRevenue.map((item) => [`${item._id.year}-${item._id.month}`, Number(item.total || 0)])
  );
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return {
      key: `${year}-${month}`,
      year,
      month,
      label: date.toLocaleString('en-US', { month: 'short' }),
      total: revenueByMonth.get(`${year}-${month}`) || 0,
    };
  });
};

const getOrderSummary = (order) => {
  const firstItem = order.orderItems?.[0];
  const itemCount = order.orderItems?.length || 0;
  const name = firstItem?.name || firstItem?.product?.name || 'Order item';
  return itemCount > 1 ? `${name} + ${itemCount - 1} more` : name;
};

const getImage = (image) => (typeof image === 'string' ? image : image?.url || '');

const getOrderCode = (order, prefix) => `${prefix} #${String(order?._id || '').slice(-6).toUpperCase()}`;

const BusinessCard = ({ title, subtitle, prefix, data = {}, orders = [], icon: Icon, tone, onView }) => {
  const toneClass = tone === 'b2b'
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : 'bg-green-50 text-green-700 border-green-100';
  const buttonClass = tone === 'b2b'
    ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
    : 'text-green-700 bg-green-50 hover:bg-green-100';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-950">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button onClick={onView} className={`pressable rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${buttonClass}`}>
          View orders
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Revenue', formatMoney(data.paidRevenue)],
          ['Orders', data.totalOrders || 0],
          ['Delivered Orders', data.delivered || 0],
          ['AOV', formatMoney(data.averageOrderValue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="mt-1 text-lg font-extrabold text-gray-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['Pending', data.pending, 'yellow'],
          ['Packed', data.packed, 'blue'],
          ['Shipped', data.shipped, 'purple'],
          ['Delivered', data.delivered, 'green'],
          ['Cancelled', data.cancelled, 'red'],
        ].map(([label, value, color]) => (
          <Badge key={label} color={color}>{label}: {value || 0}</Badge>
        ))}
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Recent {prefix} Orders</p>
          <span className="text-[10px] font-semibold text-gray-400">Codes stay scoped by type</span>
        </div>
        <div className="space-y-2">
          {orders.length > 0 ? orders.slice(0, 3).map((order) => (
            <div key={order._id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-gray-900">{getOrderSummary(order)}</p>
                <p className="mt-0.5 font-mono text-[10px] text-gray-500" title={order._id}>{getOrderCode(order, prefix)} | {order.user?.name || 'Unknown'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-gray-950">{formatMoney(order.totalPrice)}</p>
                <Badge color={order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'yellow'}>{order.status}</Badge>
              </div>
            </div>
          )) : (
            <p className="rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-500">No {prefix} orders yet</p>
          )}
        </div>
        <button
          onClick={onView}
          className={`pressable mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${buttonClass}`}
        >
          Go to {prefix} orders
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const DashboardModule = ({ stats, loading, setActiveTab }) => {
  const revenueChart = stats?.monthlyRevenue || [];
  const points = getLastSixMonths(revenueChart);
  const maxRev = getNiceMax(Math.max(...points.map((r) => r.total), 0));
  const axisTicks = [1, 0.75, 0.5, 0.25, 0];
  const hasRevenueData = points.some((item) => item.total > 0);
  const averageOrderValue = stats?.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders) : 0;
  const b2cStats = stats?.businessBreakdown?.b2c || {};
  const b2bStats = stats?.businessBreakdown?.b2b || {};

  // SVG Chart Calculations
  const width = 600;
  const height = 260;
  const margin = { top: 22, right: 22, bottom: 42, left: 78 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
  const barWidth = Math.min(44, chartWidth / points.length - 16);

  const coords = points.map((r, index) => {
    const x = margin.left + index * xStep;
    const y = margin.top + chartHeight - (r.total / maxRev) * chartHeight;
    return { x, y, total: r.total, label: r.label };
  });

  const linePath = coords.map((c, index) => `${index === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = coords.length > 0 
    ? `${linePath} L ${coords[coords.length - 1].x} ${margin.top + chartHeight} L ${coords[0].x} ${margin.top + chartHeight} Z`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Current dashboard snapshot & business analytics</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl border border-gray-150" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { label: 'Total Customers', value: stats.totalUsers, icon: Users, color: 'blue', desc: 'Registered accounts' },
              { label: 'Products Catalog', value: stats.totalProducts, icon: Package, color: 'purple', desc: 'Items in inventory' },
              { label: 'Processed Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'orange', desc: 'Total checkout count' },
              { label: 'Gross Revenue', value: formatMoney(stats.totalRevenue), icon: DollarSign, color: 'green', desc: 'Earnings history total' },
              { label: 'Average Order Value', value: formatMoney(averageOrderValue), icon: DollarSign, color: 'blue', desc: 'AOV per checkout' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-xs relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`w-10 h-10 ${colorMap[s.color] || colorMap.blue} rounded-xl flex items-center justify-center`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <TrendingUp className="w-3 h-3" />
                    Current
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight relative z-10">{s.value}</p>
                <p className="text-sm font-bold text-gray-800 mt-1 relative z-10">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <BusinessCard
              title="B2C Retail Business"
              subtitle="Customer website orders only"
              prefix="B2C"
              data={b2cStats}
              orders={stats.recentB2COrders || []}
              icon={ShoppingCart}
              tone="b2c"
              onView={() => setActiveTab?.('orders')}
            />
            <BusinessCard
              title="B2B Wholesale Business"
              subtitle="Wholesale/B2B order flow only"
              prefix="B2B"
              data={b2bStats}
              orders={stats.recentB2BOrders || []}
              icon={Building2}
              tone="b2b"
              onView={() => setActiveTab?.('b2b-orders')}
            />
          </div>

          {/* Revenue Chart & Low Stock */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Custom SVG Line Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Monthly sales and growth indicators</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Paid Revenue
                  </div>
                </div>
                {hasRevenueData ? (
                  <div className="relative pt-2 h-72">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1853A4" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#1853A4" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1853A4" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#4EA7DD" stopOpacity="0.35" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines & Y axis labels */}
                      {axisTicks.map((tick, i) => {
                        const y = margin.top + chartHeight - tick * chartHeight;
                        const labelVal = maxRev * tick;
                        return (
                          <g key={i}>
                            <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3 3" />
                            <text x={margin.left - 12} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-500 font-semibold">
                              {formatAxisMoney(labelVal)}
                            </text>
                          </g>
                        );
                      })}

                      <line x1={margin.left} y1={margin.top + chartHeight} x2={width - margin.right} y2={margin.top + chartHeight} stroke="#d1d5db" strokeWidth="1.2" />
                      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke="#e5e7eb" strokeWidth="1" />

                      {/* Revenue bars */}
                      {coords.map((c, i) => {
                        const barHeight = Math.max(2, (c.total / maxRev) * chartHeight);
                        const x = c.x - barWidth / 2;
                        const y = margin.top + chartHeight - barHeight;
                        return (
                          <g key={`bar-${i}`}>
                            <rect x={x} y={y} width={barWidth} height={barHeight} rx="7" fill="url(#barGrad)" opacity="0.85" />
                            <title>{`${c.label}: ${formatMoney(c.total)}`}</title>
                          </g>
                        );
                      })}

                      {/* Area path */}
                      <path d={areaPath} fill="url(#salesGrad)" />

                      {/* Line path */}
                      <path d={linePath} stroke="#103F7D" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Data point dots */}
                      {coords.map((c, i) => (
                        <g key={i} className="group cursor-pointer">
                          <circle cx={c.x} cy={c.y} r="4.5" fill="white" stroke="#103F7D" strokeWidth="2.4" />
                          <circle cx={c.x} cy={c.y} r="12" fill="transparent" />
                          {/* Tooltip text shown on hover */}
                          <title>{`${c.label}: ${formatMoney(c.total)}`}</title>
                        </g>
                      ))}

                      {/* X axis labels */}
                      {coords.map((c, i) => (
                        <text key={i} x={c.x} y={height - 14} textAnchor="middle" className="text-[11px] fill-gray-600 font-bold">
                          {c.label}
                        </text>
                      ))}
                    </svg>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Paid order revenue, last 6 months</span>
                      <span>Peak scale: {formatAxisMoney(maxRev)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-55 rounded-xl">
                    <DollarSign className="w-8 h-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-550">No revenue data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Alerts Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Inventory Status</h2>
                  <span className="text-xs text-gray-400">Low Stock Warning</span>
                </div>
                {stats.lowStock?.length > 0 ? (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {stats.lowStock.map((p) => (
                      <div 
                        key={p._id} 
                        onClick={() => {
                          if (setActiveTab) {
                            localStorage.setItem('editProductId', p._id);
                            setActiveTab('products');
                          }
                        }}
                        className="flex items-center justify-between p-3 bg-gray-55 rounded-xl border border-gray-100 hover:border-brand/30 transition-all hover:bg-brand/5 cursor-pointer"
                        title="Click to edit product"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-550 font-mono mt-0.5">SKU: {p.sku || 'N/A'}</p>
                        </div>
                        <Badge color={p.stock === 0 ? 'red' : p.stock < 5 ? 'orange' : 'yellow'}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl">
                    <ShoppingBag className="w-8 h-8 text-green-300" />
                    <p className="mt-2 text-xs text-gray-500">All products are well stocked</p>
                  </div>
                )}
              </div>
              {stats.outOfStock > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 border border-red-100 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-bold text-red-700">{stats.outOfStock} items out of stock</p>
                </div>
              )}
            </div>
          </div>

          {/* Activities Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Sales</h2>
              <div className="space-y-3">
                {stats.recentOrders?.map((order) => (
                  <div key={order._id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand/10 transition-all hover:bg-white">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-bold text-gray-900">{getOrderSummary(order)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] text-gray-500 bg-white border border-gray-200 px-1 py-0.5 rounded">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium">{order.user?.name || 'Unknown'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex -space-x-1 overflow-hidden">
                          {(order.orderItems || []).slice(0, 3).map((item, idx) => (
                            <img
                              key={idx}
                              src={item.image || getImage(item.product?.images?.[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop'}
                              alt=""
                              className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover border border-gray-100"
                            />
                          ))}
                        </div>
                        {(order.orderItems || []).length > 3 && (
                          <span className="text-[9px] text-gray-450 font-bold">+{(order.orderItems || []).length - 3}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                      <p className="text-xs font-bold text-gray-955">{formatMoney(order.totalPrice)}</p>
                      <Badge color={order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'yellow'}>{order.status}</Badge>
                    </div>
                  </div>
                )) || <p className="text-gray-550 text-xs">No recent orders</p>}
              </div>
            </div>

            {/* Recent Customers */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Latest Customers</h2>
              <div className="space-y-3">
                {stats.recentUsers?.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand/10 transition-all hover:bg-white">
                    <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
                      <span className="text-brand font-bold text-xs">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-semibold bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                        New Customer
                      </span>
                    </div>
                  </div>
                )) || <p className="text-gray-550 text-xs">No recent users</p>}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default DashboardModule;
