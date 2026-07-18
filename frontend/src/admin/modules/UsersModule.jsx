import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  User,
  Users,
  XCircle,
  Download,
  AlertTriangle,
  Save,
  FolderTree,
  Tag,
} from 'lucide-react';
import { adminAPI, prescriptionAPI, categoryAPI } from '../../api/index.js';
import { Badge, Button, EmptyState, Modal, SkeletonRow, Textarea, ConfirmDialog } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const statusColor = {
  pending: 'yellow',
  confirmed: 'blue',
  packed: 'purple',
  shipped: 'orange',
  delivered: 'green',
  cancelled: 'red',
};

const prescriptionColor = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const formatMoney = (value = 0) => `₱${Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');
const shortId = (id = '') => `#${String(id).slice(-6).toUpperCase()}`;

const getImage = (image) => (typeof image === 'string' ? image : image?.url || '');

const getOrderSummary = (order) => {
  const items = order?.orderItems || [];
  if (items.length === 0) return 'No items';
  const first = items[0]?.name || items[0]?.product?.name || 'Product';
  const extra = items.length > 1 ? ` +${items.length - 1} more` : '';
  return `${first}${extra}`;
};

const StatCard = ({ icon: Icon, label, value, tone = 'gray' }) => {
  const tones = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone] || tones.gray}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-gray-950">{value}</p>
        </div>
      </div>
    </div>
  );
};

const UsersModule = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewData, setViewData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [viewOrder, setViewOrder] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewingId, setViewingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [localAdminNotes, setLocalAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [toggleUser, setToggleUser] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await categoryAPI.getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (viewData?.user) {
      setLocalAdminNotes(viewData.user.adminNotes || '');
    } else {
      setLocalAdminNotes('');
    }
  }, [viewData]);

  const handleSaveNotes = async () => {
    if (!user?._id) return;
    try {
      setSavingNotes(true);
      await adminAPI.updateUserAdminNotes(user._id, { adminNotes: localAdminNotes });
      setViewData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          user: {
            ...prev.user,
            adminNotes: localAdminNotes,
          },
        };
      });
      setMessage('Admin notes saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save admin notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownloadPrescription = async (item) => {
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
      setMessage(err.response?.data?.message || 'Failed to download prescription');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewPrescription = async (item) => {
    try {
      setViewingId(item._id);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const response = await prescriptionAPI.viewPrescription(item._id);
      const blob = new Blob([response.data], { type: item.fileType || response.headers?.['content-type'] || 'application/octet-stream' });
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewItem(item);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to view prescription');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setViewingId(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewItem(null);
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const loadUsers = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 20 };
      const categoryId = selectedSubCategory || selectedParentCategory;
      if (categoryId) params.category = categoryId;
      const { data } = await adminAPI.getAllUsers(params);
      const nextUsers = data.users || [];
      setUsers((prev) => (append ? [...prev, ...nextUsers] : nextUsers));
      setPage(pageNum);
      setTotalPages(data.pagination?.pages || 1);
      setStats(data.stats || null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [selectedParentCategory, selectedSubCategory]);

  useEffect(() => { loadUsers(1, false); }, [loadUsers]);

  const hasMore = page < totalPages;
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadUsers(page + 1, true);
  }, [hasMore, loading, loadUsers, page]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const filteredUsers = search
    ? users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search))
    : users;

  const openUserDetails = async (user) => {
    try {
      setDetailsLoading(true);
      setMessage('');
      const { data } = await adminAPI.getUserById(user._id);
      setViewData(data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleUser) return;
    try {
      setToggleLoading(true);
      await adminAPI.updateUserStatus(toggleUser._id, { isActive: !toggleUser.isActive });
      await loadUsers();
      setToggleUser(null);
      setMessage(`User ${toggleUser.isActive ? 'blocked' : 'unblocked'} successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update user');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = { limit: 10000, export: 'true' };
      const categoryId = selectedSubCategory || selectedParentCategory;
      if (categoryId) params.category = categoryId;
      
      const { data } = await adminAPI.getAllUsers(params);
      const exportUsers = data.users || [];

      const headers = [
        'User ID',
        'User Code',
        'Name',
        'Email',
        'Phone',
        'Orders Count',
        'Total Spent (₱)',
        'Status',
        'Joined Date',
        'Address(es)',
        'Purchased Categories',
        'Purchased Subcategories',
        'Purchased Medicines'
      ];

      const mapper = (u) => [
        u._id || '',
        shortId(u._id),
        u.name || '',
        u.email || '',
        u.phone || '',
        u.orderCount || 0,
        u.totalSpent || 0,
        u.isActive ? 'Active' : 'Blocked',
        new Date(u.createdAt).toLocaleDateString(),
        u.formattedAddresses || 'No address added',
        u.purchasedCategories || 'No category purchases',
        u.purchasedSubcategories || 'No subcategory purchases',
        u.purchasedMedicines || 'No purchases'
      ];

      await exportToExcel(exportUsers, headers, mapper, 'users_export', 'Users');
    } catch (err) {
      console.error('Failed to export users to excel:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const user = viewData?.user;
  const orders = viewData?.orders || [];
  const activeOrders = viewData?.activeOrders || [];
  const cart = viewData?.cart;
  const prescriptions = viewData?.prescriptions || [];
  const summary = viewData?.summary || {};

  const parentCategories = categories.filter((c) => !c.parent);
  const subCategories = selectedParentCategory
    ? categories.filter((c) => c.parent === selectedParentCategory || c.parent?._id === selectedParentCategory)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">View customer profiles, order history, carts, prescriptions, and saved addresses.</p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Customers" value={stats.totalUsers || 0} tone="blue" />
          <StatCard icon={CheckCircle} label="Active Users" value={stats.activeUsers || 0} tone="green" />
          <StatCard icon={XCircle} label="Blocked Users" value={stats.blockedUsers || 0} tone="red" />
          <StatCard icon={Activity} label="Verified Users" value={stats.verifiedUsers || 0} tone="yellow" />
        </div>
      )}

      {message && <div className={`rounded-xl p-3 text-sm ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <FolderTree className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedParentCategory}
              onChange={(e) => {
                setSelectedParentCategory(e.target.value);
                setSelectedSubCategory('');
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-8 text-sm font-semibold text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white cursor-pointer appearance-none"
            >
              <option value="">All Main Categories</option>
              {parentCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="pressable inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark focus:outline-none transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-white/80" />
            )}
            Export Excel
          </button>
        </div>
      </div>

      {selectedParentCategory && (
        <div className="bg-gradient-to-br from-brand/5 via-blue-50/10 to-white border border-brand/10 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand/5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-brand/70 font-bold uppercase tracking-wider">Active Purchased Category Filter</p>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5 flex items-center gap-2">
                  <span>{parentCategories.find(c => c._id === selectedParentCategory)?.name}</span>
                  {selectedSubCategory && (
                    <>
                      <span className="text-gray-400 font-normal">→</span>
                      <span className="text-brand">{categories.find(c => c._id === selectedSubCategory)?.name}</span>
                    </>
                  )}
                </h3>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-white px-3.5 py-1.5 rounded-xl border border-brand/10 shadow-sm self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
              Found {users.length} Customer(s)
            </div>
          </div>
          
          {subCategories.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-bold text-gray-700">Filter by Subcategory:</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedSubCategory(''); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-250 ${
                    !selectedSubCategory 
                      ? 'bg-brand text-white shadow-md shadow-brand/10 transform scale-105' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-brand/5 hover:border-brand/20'
                  }`}
                >
                  All Subcategories
                </button>
                {subCategories.map((sub) => (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => { setSelectedSubCategory(sub._id); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-250 ${
                      selectedSubCategory === sub._id 
                        ? 'bg-brand text-white shadow-md shadow-brand/10 transform scale-105' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-brand/5 hover:border-brand/20'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400 italic">
              <Tag className="w-3.5 h-3.5" />
              No subcategories available under this category.
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Orders & Value</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={7} count={4} />
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Users} title="No users found" subtitle="Try adjusting your search" /></td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => openUserDetails(u)}
                    className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
                          <span className="text-xs font-bold text-brand">{u.name?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{u.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{shortId(u._id)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">{u.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-gray-900">{u.orderCount || 0} orders</div>
                      <div className="text-[10px] text-brand font-medium mt-0.5">{formatMoney(u.totalSpent || 0)} spent</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {u.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openUserDetails(u)} className="pressable rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="View full details">
                          {detailsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setToggleUser(u)} className={`pressable rounded-lg p-1.5 transition-colors ${u.isActive ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`} title={u.isActive ? 'Block user' : 'Unblock user'}>
                          {u.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
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
      <Modal open={!!viewData} onClose={() => setViewData(null)} title="Customer Details" maxWidth="max-w-6xl">
        {user && (() => {
          const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
          const rejectedCount = prescriptions.filter((p) => p.status === 'rejected').length;
          const isHighRisk = cancelledCount >= 2 || rejectedCount >= 2;
          return (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex flex-col gap-4 rounded-2xl bg-gray-55 p-4 sm:flex-row sm:items-center sm:justify-between border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20">
                    <span className="text-xl font-bold text-brand">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-gray-950">{user.name}</p>
                      {isHighRisk && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-100 animate-pulse">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          High Risk Profile
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="mt-1 text-xs text-gray-400">ID: {user._id} | Joined {formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge color={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Blocked'}</Badge>
                    <Badge color={user.isVerified ? 'green' : 'gray'}>{user.isVerified ? 'Verified' : 'Unverified'}</Badge>
                    <Badge color="blue">{user.role || 'user'}</Badge>
                  </div>
                  <Button
                    variant={user.isActive ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => setToggleUser(user)}
                  >
                    {user.isActive ? 'Block Customer' : 'Unblock Customer'}
                  </Button>
                </div>
              </div>

              {/* High Risk Alert Banner */}
              {isHighRisk && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 animate-fadeIn">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold">Risk Warning Triggered</p>
                    <p className="mt-1 text-xs text-red-750">
                      This customer has reached high-risk thresholds:
                      {cancelledCount >= 2 && ` • Repeated cancelled orders (${cancelledCount} cancellations)`}
                      {rejectedCount >= 2 && ` • Repeated rejected prescriptions (${rejectedCount} rejections)`}
                    </p>
                  </div>
                </div>
              )}

              {/* Stats Summary row */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard icon={Package} label="Total Orders" value={summary.totalOrders || 0} tone="blue" />
                <StatCard icon={Activity} label="Active Orders" value={summary.activeOrders || 0} tone="yellow" />
                <StatCard icon={CheckCircle} label="Delivered" value={summary.deliveredOrders || 0} tone="green" />
                <StatCard icon={FileText} label="Prescriptions" value={summary.prescriptionCount || 0} tone="gray" />
                <StatCard icon={ShoppingCart} label="Cart Items" value={summary.cartItemCount || 0} tone="red" />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-brand" />
                        <h3 className="font-bold text-gray-950">Current Cart</h3>
                      </div>
                      <span className="text-xs text-gray-400">{cart?.items?.length || 0} items</span>
                    </div>
                    {!cart?.items?.length ? (
                      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Cart is empty.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {cart.items.map((item) => (
                            <div key={item.product?._id || item.product} className="flex items-center gap-2 rounded-xl bg-gray-50 p-3">
                              <img src={getImage(item.product?.images?.[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop'} alt="" className="h-10 w-10 rounded-lg object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-gray-900">{item.product?.name || 'Product'}</p>
                                <p className="text-[10px] text-gray-500">Qty {item.quantity} | {formatMoney(item.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-gray-100 text-right">
                          <span className="text-sm text-gray-500 mr-2">Subtotal:</span>
                          <span className="text-base font-bold text-gray-950">{formatMoney(cart.subtotal)}</span>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-gray-950">Order History</h3>
                      <span className="text-xs text-gray-400">{orders.length} orders</span>
                    </div>
                    {orders.length === 0 ? (
                      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No orders placed yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order._id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-955">{shortId(order._id)}</p>
                                  <Badge color={statusColor[order.status] || 'gray'}>{order.status}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <p className="text-sm font-bold text-gray-950">{formatMoney(order.totalPrice)}</p>
                                <button
                                  onClick={() => setViewOrder(order)}
                                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                  title="View order details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {(order.orderItems || []).map((item, index) => (
                                <div key={`${order._id}-${index}`} className="flex items-center gap-2 rounded-lg bg-gray-55 p-2">
                                  <img src={item.image || getImage(item.product?.images?.[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop'} alt="" className="h-9 w-9 rounded-lg object-cover" />
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-gray-900">{item.name || item.product?.name}</p>
                                    <p className="text-[10px] text-gray-550">Qty {item.quantity} | {formatMoney(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {order.shippingAddress && (
                              <p className="mt-2 text-xs text-gray-500">
                                Ship to: {order.shippingAddress.name}, {order.shippingAddress.addressLine1}, {order.shippingAddress.cityMunicipality}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <div className="space-y-5">
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand" />
                      <h3 className="font-bold text-gray-950">Admin Notes</h3>
                    </div>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add administrative notes about this customer..."
                        value={localAdminNotes}
                        onChange={(e) => setLocalAdminNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={savingNotes || localAdminNotes === (user.adminNotes || '')}
                        >
                          {savingNotes ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5" />
                              Save Notes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 font-bold text-gray-950">Contact</h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-gray-600"><User className="h-4 w-4 text-gray-400" /> {user.phone || 'No phone number'}</p>
                      <p className="text-gray-650">Last login: {formatDate(user.lastLogin)}</p>
                      <p className="text-gray-650">Total spent: <span className="font-bold text-gray-950">{formatMoney(summary.totalSpent)}</span></p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-gray-950">Prescriptions</h3>
                      <span className="text-xs text-gray-400">{prescriptions.length}</span>
                    </div>
                    {prescriptions.length === 0 ? (
                      <p className="text-sm text-gray-500">No prescriptions uploaded.</p>
                    ) : (
                      <div className="space-y-2">
                        {prescriptions.map((item) => (
                          <div key={item._id} className="rounded-xl bg-gray-55 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-gray-900">{item.originalFileName}</p>
                                <p className="mt-0.5 text-[10px] text-gray-500">{item.fileType} | {formatDate(item.uploadedAt || item.createdAt)}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <Badge color={prescriptionColor[item.status] || 'gray'}>{item.status}</Badge>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleViewPrescription(item)}
                                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-blue-600 transition-colors"
                                    title="View prescription"
                                    disabled={viewingId === item._id}
                                  >
                                    {viewingId === item._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPrescription(item)}
                                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-green-600 transition-colors"
                                    title="Download prescription"
                                    disabled={downloadingId === item._id}
                                  >
                                    {downloadingId === item._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Download className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {item.requestedProduct && <p className="mt-1 truncate text-xs text-gray-600">For: {item.requestedProduct.name}</p>}
                            {item.adminNotes && <p className="mt-1 text-xs text-red-650">{item.adminNotes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand" />
                      <h3 className="font-bold text-gray-950">Saved Addresses</h3>
                    </div>
                    {!user.addresses?.length ? (
                      <p className="text-sm text-gray-500">No saved addresses.</p>
                    ) : (
                      <div className="space-y-2">
                        {user.addresses.map((addr) => (
                          <div key={addr._id} className="rounded-xl bg-gray-55 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900">{addr.name}</p>
                              {addr.isDefault && <Badge color="blue">Default</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-gray-600">{addr.phone}</p>
                            <p className="mt-1 text-xs text-gray-655">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.barangay}, {addr.cityMunicipality}, {addr.province} {addr.zipCode}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* View Order Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order Details: ${viewOrder ? shortId(viewOrder._id) : ''}`} maxWidth="max-w-2xl">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                <p className="font-medium text-gray-900">{viewOrder.user?.name || user?.name}</p>
                <p className="text-sm text-gray-600">{viewOrder.user?.email || user?.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Shipping Address</p>
                <p className="text-sm text-gray-950">{viewOrder.shippingAddress?.name}</p>
                <p className="text-sm text-gray-600">{viewOrder.shippingAddress?.addressLine1}, {viewOrder.shippingAddress?.barangay ? viewOrder.shippingAddress?.barangay + ', ' : ''}{viewOrder.shippingAddress?.cityMunicipality}, {viewOrder.shippingAddress?.province} - {viewOrder.shippingAddress?.zipCode}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Items</p>
              <div className="space-y-2">
                {viewOrder.orderItems?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{item.name || item.product?.name} x{item.quantity}</span>
                    <span className="font-medium text-gray-900">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatMoney(viewOrder.totalPrice)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gray-50 rounded-xl flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment</p>
                <p className="text-sm font-medium text-gray-900">{viewOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                <p className="text-sm text-gray-600">{viewOrder.isPaid ? 'Paid' : 'Not Paid'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <Badge color={statusColor[viewOrder.status] || 'gray'}>{viewOrder.status}</Badge>
                {viewOrder.trackingNumber && <p className="text-sm text-gray-600 mt-1">Tracking: {viewOrder.trackingNumber}</p>}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewOrder(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Prescription Modal */}
      <Modal open={!!previewItem} onClose={closePreview} title="View Prescription" maxWidth="max-w-4xl">
        {previewItem && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{previewItem.originalFileName}</p>
              <p className="mt-1 text-sm text-gray-500">
                {user?.name} | {previewItem.fileType}
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              {previewItem.fileType === 'application/pdf' ? (
                <iframe src={previewUrl} title="Prescription PDF" className="h-[70vh] w-full bg-white" />
              ) : (
                <img src={previewUrl} alt="Prescription preview" className="max-h-[70vh] w-full object-contain mx-auto" />
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closePreview}>Close</Button>
              <Button onClick={() => handleDownloadPrescription(previewItem)}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Block/Unblock Confirmation Dialog */}
      <ConfirmDialog
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={handleToggleStatus}
        title={toggleUser?.isActive ? 'Block Customer' : 'Unblock Customer'}
        message={`Are you sure you want to ${toggleUser?.isActive ? 'block' : 'unblock'} ${toggleUser?.name || 'this customer'}?`}
        loading={toggleLoading}
      />

    </div>
  );
};
export default UsersModule;
