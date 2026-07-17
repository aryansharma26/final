import { useState, useEffect, useCallback } from 'react';
import { Search, Building2, Eye, CheckCircle, Trash2, Download, Loader2 } from 'lucide-react';
import { adminAPI } from '../../api/index.js';
import { Badge, Select, Modal, EmptyState, SkeletonRow, ConfirmDialog } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const B2BModule = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewEnquiry, setViewEnquiry] = useState(null);
  const [message, setMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = { limit: 10000, export: 'true' };
      if (statusFilter) params.isRead = statusFilter;
      
      const { data } = await adminAPI.getContacts(params);
      const allContacts = data.contacts || [];

      const b2bList = allContacts.filter((c) => {
        const isB2B = c.subject?.startsWith('B2B Enquiry');
        if (!isB2B) return false;
        if (search) {
          const term = search.toLowerCase();
          return (
            c.name?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.message?.toLowerCase().includes(term)
          );
        }
        return true;
      });

      const headers = [
        'Contact Person',
        'Email',
        'Subject',
        'Message',
        'Status',
        'Date Received'
      ];

      const mapper = (c) => [
        c.name || '',
        c.email || '',
        c.subject || '',
        c.message || '',
        c.isRead ? 'Read' : 'Unread',
        c.createdAt ? new Date(c.createdAt).toLocaleString() : ''
      ];

      await exportToExcel(b2bList, headers, mapper, 'b2b_enquiries_export', 'B2B Enquiries');
    } catch (err) {
      console.error('Failed to export B2B enquiries:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEnquiries = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (statusFilter) params.isRead = statusFilter;
      const { data } = await adminAPI.getContacts(params);
      // Filter only B2B enquiries (subject starts with "B2B Enquiry")
      const b2bList = (data.contacts || []).filter((c) =>
        c.subject?.startsWith('B2B Enquiry')
      );
      setEnquiries((prev) => (append ? [...prev, ...b2bList] : b2bList));
      setPage(pageNum);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load B2B enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadEnquiries(1, false); }, [loadEnquiries]);

  const hasMore = page < totalPages;
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadEnquiries(page + 1, true);
  }, [hasMore, loading, loadEnquiries, page]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const filteredEnquiries = search
    ? enquiries.filter((e) =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.subject?.toLowerCase().includes(search.toLowerCase()) ||
        e.message?.toLowerCase().includes(search.toLowerCase())
      )
    : enquiries;

  const handleToggleRead = async (enquiry) => {
    try {
      await adminAPI.toggleContactRead(enquiry._id);
      loadEnquiries(1, false);
      setMessage('Status updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await adminAPI.deleteContact(deleteId);
      setDeleteId(null);
      loadEnquiries(1, false);
      setMessage('Enquiry deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Parse B2B details from the formatted message
  const parseB2BDetails = (contact) => {
    const lines = contact.message?.split('\n') || [];
    const details = {};
    lines.forEach((line) => {
      if (line.startsWith('Company:')) details.company = line.replace('Company:', '').trim();
      if (line.startsWith('Business Type:')) details.businessType = line.replace('Business Type:', '').trim();
      if (line.startsWith('Product Interest:')) details.productInterest = line.replace('Product Interest:', '').trim();
      if (line.startsWith('Estimated Quantity:')) details.quantity = line.replace('Estimated Quantity:', '').trim();
    });
    // Extract contact name from "Name | Company"
    const nameParts = contact.name?.split('|') || [];
    details.contactName = nameParts[0]?.trim() || contact.name;
    details.companyName = nameParts[1]?.trim() || details.company || 'N/A';
    return details;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Enquiries</h1>
          <p className="mt-1 text-sm text-gray-500">Bulk orders and business partnership requests.</p>
        </div>
      </div>

      {message && <div className={`p-3 rounded-xl text-sm ${message.includes('updated') || message.includes('deleted') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search B2B enquiries..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'false', label: 'New' }, { value: 'true', label: 'Reviewed' }]} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Business Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product Interest</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Quantity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={8} />
              ) : filteredEnquiries.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={Building2} title="No B2B enquiries" subtitle="Enquiries will appear here when submitted" /></td></tr>
              ) : (
                filteredEnquiries.map((e) => {
                  const details = parseB2BDetails(e);
                  return (
                    <tr key={e._id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${!e.isRead ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-xs">{details.contactName}</p>
                        <p className="text-[10px] text-gray-500">{e.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-xs">{details.companyName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{details.businessType || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{details.productInterest || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{details.quantity || 'N/A'}</td>
                      <td className="px-4 py-3"><Badge color={e.isRead ? 'green' : 'blue'}>{e.isRead ? 'Reviewed' : 'New'}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewEnquiry(e)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleToggleRead(e)} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title={e.isRead ? 'Mark New' : 'Mark Reviewed'}>
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(e._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={!!viewEnquiry} onClose={() => setViewEnquiry(null)} title="B2B Enquiry Details" maxWidth="max-w-lg">
        {viewEnquiry && (() => {
          const details = parseB2BDetails(viewEnquiry);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Contact Name</p>
                  <p className="text-sm font-medium text-gray-900">{details.contactName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm font-medium text-gray-900">{details.companyName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{viewEnquiry.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{viewEnquiry.phone || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Business Type</p>
                  <p className="text-sm font-medium text-gray-900">{details.businessType || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Product Interest</p>
                  <p className="text-sm font-medium text-gray-900">{details.productInterest || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Estimated Quantity</p>
                  <p className="text-sm font-medium text-gray-900">{details.quantity || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(viewEnquiry.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Requirements</p>
                <p className="text-sm text-gray-700 leading-relaxed">{viewEnquiry.message?.split('Message:')[1]?.trim() || viewEnquiry.message}</p>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Enquiry" message="Are you sure you want to delete this B2B enquiry?" loading={deleteLoading} />
    </div>
  );
};

export default B2BModule;
