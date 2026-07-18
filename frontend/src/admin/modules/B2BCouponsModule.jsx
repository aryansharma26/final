import { useCallback, useEffect, useState } from 'react';
import { Edit2, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { adminAPI } from '../../api/index.js';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, Select, SkeletonRow, Textarea } from '../components/AdminUI.jsx';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  startDate: '',
  endDate: '',
  perUserLimit: '',
  isActive: true,
};

const B2BCouponsModule = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getB2BCoupons();
      setCoupons(data.coupons || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load B2B coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setFormData(emptyForm);
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
      perUserLimit: coupon.perUserLimit || coupon.usageLimit || '',
      isActive: coupon.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : null,
      };
      if (editingCoupon) {
        await adminAPI.updateB2BCoupon(editingCoupon._id, payload);
        setMessage('B2B coupon updated successfully');
      } else {
        await adminAPI.createB2BCoupon(payload);
        setMessage('B2B coupon created successfully');
      }
      setModalOpen(false);
      loadCoupons();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save B2B coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await adminAPI.deleteB2BCoupon(deleteId);
      setDeleteId(null);
      loadCoupons();
      setMessage('B2B coupon deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete B2B coupon');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isExpired = (coupon) => new Date(coupon.endDate) < new Date();
  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return { label: 'Inactive', color: 'red' };
    if (isExpired(coupon)) return { label: 'Expired', color: 'red' };
    return { label: 'Active', color: 'green' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">B2B Coupons</h1>
          <p className="mt-0.5 text-xs text-gray-500">Wholesale checkout coupons for business purchases.</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add Coupon</Button>
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
                <tr><td colSpan={6}><EmptyState icon={Tag} title="No B2B coupons found" subtitle="Create your first B2B coupon" /></td></tr>
              ) : (
                coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                  <tr key={coupon._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium text-gray-900">{coupon.code}</p>
                      <p className="text-xs text-gray-500">{coupon.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `PHP ${coupon.discountValue}`}
                        {coupon.maxDiscountAmount ? ` (max PHP ${coupon.maxDiscountAmount})` : ''}
                      </p>
                      <p className="text-xs text-gray-500">Min order: PHP {coupon.minOrderAmount}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <p>{coupon.usageCount || 0} total</p>
                      <p className="text-xs text-gray-500">Per user: {coupon.perUserLimit || coupon.usageLimit || 'Unlimited'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(coupon.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge color={status.color}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(coupon)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(coupon._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCoupon ? 'Edit B2B Coupon' : 'Add B2B Coupon'} maxWidth="max-w-lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
          <Select label="Discount Type" value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed Amount' }]} />
          <Input label="Discount Value" type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} />
          <Input label="Min Order Amount" type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} />
          <Input label="Max Discount Amount" type="number" value={formData.maxDiscountAmount} onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })} />
          <Input label="Per User Limit" type="number" min={1} value={formData.perUserLimit} onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })} />
          <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="sm:col-span-2" />
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
            Active
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete B2B Coupon" message="Are you sure you want to delete this B2B coupon?" loading={deleteLoading} />
    </div>
  );
};

export default B2BCouponsModule;
