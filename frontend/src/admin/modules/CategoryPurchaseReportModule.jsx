import { useEffect, useState } from 'react';
import { Download, Eye, Loader2, ShoppingCart } from 'lucide-react';
import { adminAPI, categoryAPI } from '../../api/index.js';
import { EmptyState, SkeletonRow } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';

const formatMoney = (value = 0) => `PHP ${Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

const CategoryPurchaseReportModule = () => {
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await categoryAPI.getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load categories');
      }
    };
    loadCategories();
  }, []);

  const parentCategories = categories.filter((category) => !category.parent);
  const subCategories = parentCategory
    ? categories.filter((category) => category.parent === parentCategory || category.parent?._id === parentCategory)
    : [];

  const selectedCategoryId = subCategory || parentCategory;
  const reportParams = (extra = {}) => ({
    ...extra,
    ...(selectedCategoryId ? { category: selectedCategoryId } : {}),
  });

  const clearReport = () => {
    setRows([]);
    setTotal(0);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data } = await adminAPI.getUserCategoryPurchases(reportParams({ limit: 100 }));
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load retail category report');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      setExporting(true);
      setMessage('');
      const { data } = await adminAPI.getUserCategoryPurchases(reportParams({ export: 'true' }));
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
        'Product Category',
        'Product Subcategory',
        'Product',
        'Brand',
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
        row.categoryName || '',
        row.subcategoryName || '',
        row.productName || '',
        row.brand || '',
        row.totalQuantity || 0,
        row.totalSpent || 0,
        row.orderCount || 0,
        row.orderCodes || '',
        row.orderStatuses || '',
        row.lastOrderedAt ? new Date(row.lastOrderedAt).toLocaleDateString() : '',
      ];

      exportToExcel(exportRows, headers, mapper, 'retail_category_purchase_report', 'Retail Category Purchases');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to export retail category report');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retail Category Purchase Report</h1>
          <p className="mt-1 text-sm text-gray-500">Find customers by regular product category or subcategory and export the exact products purchased.</p>
        </div>
      </div>

      {message && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</div>}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Category</label>
            <select
              value={parentCategory}
              onChange={(event) => {
                setParentCategory(event.target.value);
                setSubCategory('');
                clearReport();
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All Categories</option>
              {parentCategories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Subcategory</label>
            <select
              value={subCategory}
              onChange={(event) => {
                setSubCategory(event.target.value);
                clearReport();
              }}
              disabled={!parentCategory || subCategories.length === 0}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">All Subcategories</option>
              {subCategories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
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
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Matched purchases</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand ring-1 ring-gray-100">
            {total} row(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Category</th>
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
                    <EmptyState icon={ShoppingCart} title="No retail report loaded" subtitle="Choose category filters or load all categories" />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.userId}-${row.productId}`} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{row.userName}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                      <p className="text-[11px] font-mono text-gray-400">{row.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{row.productName}</p>
                      <p className="text-xs text-gray-500">{row.brand || 'No brand'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-gray-800">{row.categoryName || '-'}</p>
                      <p className="text-[11px] text-brand">{row.subcategoryName || 'No subcategory'}</p>
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

export default CategoryPurchaseReportModule;
