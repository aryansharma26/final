import { useEffect, useState } from 'react';
import { Download, Eye, Loader2, ShoppingCart } from 'lucide-react';
import { adminAPI, b2bProductAPI } from '../../api/index.js';
import { EmptyState, SkeletonRow } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';

const formatMoney = (value = 0) => `PHP ${Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

const B2BPurchaseReportModule = () => {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await b2bProductAPI.getAllProducts({ limit: 10000 });
        setProducts(data.products || []);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load B2B products');
      }
    };
    loadProducts();
  }, []);

  const reportParams = (extra = {}) => ({
    ...extra,
    ...(productId ? { product: productId } : {}),
  });

  const clearReport = () => {
    setRows([]);
    setTotal(0);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data } = await adminAPI.getB2BPurchaseReport(reportParams({ limit: 100 }));
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load B2B purchase report');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      setExporting(true);
      setMessage('');
      const { data } = await adminAPI.getB2BPurchaseReport(reportParams({ export: 'true' }));
      const exportRows = data.rows || [];
      const headers = [
        'User ID',
        'User Code',
        'Name',
        'Email',
        'Phone',
        'Status',
        'City',
        'Province',
        'B2B Product',
        'Brand',
        'SKU',
        'Tier',
        'Unit Price',
        'Total Quantity',
        'Total Spent (PHP)',
        'Order Count',
        'Order IDs',
        'Order Statuses',
        'Last Ordered',
      ];
      const mapper = (row) => [
        row.userId || '',
        row.userCode || '',
        row.userName || '',
        row.email || '',
        row.phone || '',
        row.status || '',
        row.city || '',
        row.province || '',
        row.productName || '',
        row.brand || '',
        row.sku || '',
        row.tierLabel || '',
        row.unitPrice || 0,
        row.totalQuantity || 0,
        row.totalSpent || 0,
        row.orderCount || 0,
        row.orderCodes || '',
        row.orderStatuses || '',
        row.lastOrderedAt ? new Date(row.lastOrderedAt).toLocaleDateString() : '',
      ];

      await exportToExcel(exportRows, headers, mapper, 'b2b_purchase_report', 'B2B Purchases');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to export B2B purchase report');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Purchase Report</h1>
          <p className="mt-1 text-sm text-gray-500">Find wholesale buyers by B2B product and pricing tier.</p>
        </div>
      </div>

      {message && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</div>}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_auto_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">B2B Product</label>
            <select
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                clearReport();
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All B2B Products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Load
          </button>

          <button
            type="button"
            onClick={exportReport}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Matched B2B purchases</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand ring-1 ring-gray-100">
            {total} row(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Tier</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Spent</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Last Ordered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={7} count={4} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={ShoppingCart} title="No B2B report loaded" subtitle="Choose a product or load all B2B products" />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.userId}-${row.productId}-${row.tierLabel}`} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{row.userName}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                      <p className="text-[11px] font-mono text-gray-400">{row.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{row.productName}</p>
                      <p className="text-xs text-gray-500">{row.brand || 'No brand'} {row.sku ? `| ${row.sku}` : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-gray-900">{row.tierLabel || '-'}</p>
                      <p className="text-[11px] text-gray-500">{formatMoney(row.unitPrice || 0)} / unit</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{row.totalQuantity || 0}</td>
                    <td className="px-4 py-3 text-sm font-bold text-brand">{formatMoney(row.totalSpent || 0)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{row.orderCount || 0}</p>
                      <p className="max-w-[180px] truncate text-[11px] text-gray-400" title={row.orderCodes}>{row.orderCodes || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                      {row.lastOrderedAt ? new Date(row.lastOrderedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default B2BPurchaseReportModule;
