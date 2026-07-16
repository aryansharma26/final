import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, Tag } from 'lucide-react';
import { adminAPI } from '../../api/index.js';
import { Badge, Button, Input, Select, Textarea, Modal, ConfirmDialog, EmptyState, SkeletonRow } from '../components/AdminUI.jsx';

const CouponsModule = ({ embedded = false }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', startDate: '', endDate: '', usageLimit: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getCoupons();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setFormData({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', startDate: '', endDate: '', usageLimit: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 10) : '',
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const data = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      };
      if (editingCoupon) {
        await adminAPI.updateCoupon(editingCoupon._id, data);
        setMessage('Coupon updated successfully');
      } else {
        await adminAPI.createCoupon(data);
        setMessage('Coupon created successfully');
      }
      setModalOpen(false);
      loadCoupons();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await adminAPI.deleteCoupon(deleteId);
      setDeleteId(null);
      loadCoupons();
      setMessage('Coupon deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isExpired = (coupon) => new Date(coupon.endDate) < new Date();
  const isActive = (coupon) => coupon.isActive && !isExpired(coupon) && (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit);

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={embedded ? 'text-sm font-bold text-gray-900' : 'text-2xl font-bold text-gray-900'}>Coupons</h1>
          {embedded && <p className="mt-0.5 text-xs text-gray-500">Retail checkout coupons for B2C orders.</p>}
        </div>
        <Button size={embedded ? 'sm' : 'md'} onClick={openCreate}><Plus className="w-4 h-4" /> Add Coupon</Button>
      </div>

      {message && <div className={`p-3 rounded-xl text-sm ${message.includes('success') || message.includes('created') || message.includes('updated') || message.includes('deleted') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Discount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Usage</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Valid Until</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={6} />
              ) : coupons.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Tag} title="No coupons found" subtitle="Create your first coupon" /></td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium text-gray-900">{c.code}</p>
                      <p className="text-xs text-gray-500">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `₱${c.discountValue}`}
                        {c.maxDiscountAmount ? ` (max ₱${c.maxDiscountAmount})` : ''}
                      </p>
                      <p className="text-xs text-gray-500">Min order: ₱{c.minOrderAmount}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{c.usageCount} / {c.usageLimit || '∞'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(c.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge color={isActive(c) ? 'green' : 'red'}>{isActive(c) ? 'Active' : isExpired(c) ? 'Expired' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(c._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'} maxWidth="max-w-lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
          <Select label="Discount Type" value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed Amount' }]} />
          <Input label="Discount Value" type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} />
          <Input label="Min Order Amount" type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} />
          <Input label="Max Discount Amount" type="number" value={formData.maxDiscountAmount} onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })} />
          <Input label="Usage Limit" type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} />
          <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="sm:col-span-2" />
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Coupon" message="Are you sure you want to delete this coupon?" loading={deleteLoading} />
    </div>
  );
};

export default CouponsModule;
