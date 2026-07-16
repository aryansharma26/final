import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, Loader2, Package, X } from 'lucide-react';
import { b2bProductAPI } from '../../api/index.js';
import { Badge, Button, Input, Textarea, Modal, ConfirmDialog, EmptyState, SkeletonRow } from '../components/AdminUI.jsx';

const getProductImage = (product) => {
  const image = product?.images?.[0];
  return typeof image === 'string' ? image : image?.url;
};

const getImagePreviewSrc = (image) => (typeof image === 'string' ? image : image?.url);

const defaultForm = {
  name: '',
  description: '',
  brand: '',
  stock: '',
  sku: '',
  status: 'active',
  featured: false,
  bulkPricing: [],
  taxRate: 12,
};

const B2BProductsModule = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const totalRef = useRef(0);

  const loadProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await b2bProductAPI.getAllProducts(params);
      const newProducts = data.products || [];
      const total = data.pagination?.total || 0;
      totalRef.current = total;
      if (append) {
        setProducts(prev => {
          const updated = [...prev, ...newProducts];
          setHasMore(updated.length < total);
          return updated;
        });
      } else {
        setProducts(newProducts);
        setHasMore(newProducts.length < total);
      }
    } catch (err) {
      console.error('Failed to load B2B products:', err);
      setMessage(err.response?.data?.message || 'Failed to load B2B products');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadProducts(nextPage, true);
  };

  useEffect(() => {
    setPage(1);
    loadProducts(1, false);
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditingProduct(null);
    setFormData(defaultForm);
    setImageFiles([]);
    setImagePreview([]);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      brand: product.brand || '',
      stock: product.stock || '',
      sku: product.sku || '',
      status: product.status || 'active',
      featured: product.featured || false,
      bulkPricing: product.bulkPricing || [],
      taxRate: product.taxRate !== undefined ? product.taxRate : 12,
    });
    setImagePreview(product.images || []);
    setImageFiles([]);
    setFormError('');
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    imagePreview.forEach((src) => {
      if (typeof src === 'string' && src.startsWith('blob:')) URL.revokeObjectURL(src);
    });
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreview(previews);
  };

  const closeModal = () => {
    imagePreview.forEach((src) => {
      if (typeof src === 'string' && src.startsWith('blob:')) URL.revokeObjectURL(src);
    });
    setImagePreview([]);
    setModalOpen(false);
  };

  // ─── Bulk Pricing Handlers ───
  const addBulkTier = () => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: [...prev.bulkPricing, { label: '', unitPrice: '', totalPrice: '' }],
    }));
  };

  const updateBulkTier = (index, field, value) => {
    setFormData((prev) => {
      const tiers = [...prev.bulkPricing];
      tiers[index] = { ...tiers[index], [field]: value };
      return { ...prev, bulkPricing: tiers };
    });
  };

  const removeBulkTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: prev.bulkPricing.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setFormError('');
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'bulkPricing') return;
        const shouldSendEmpty = editingProduct && ['name', 'description', 'brand', 'stock', 'sku', 'status'].includes(key);
        if (value !== undefined && value !== null && (value !== '' || shouldSendEmpty)) {
          fd.append(key, value);
        }
      });
      const validBulkPricing = (formData.bulkPricing || [])
        .filter((t) => t.label && t.unitPrice)
        .map((t) => ({
          label: t.label,
          unitPrice: t.unitPrice,
          ...(t.totalPrice !== undefined && t.totalPrice !== '' ? { totalPrice: t.totalPrice } : {}),
        }));
      if (validBulkPricing.length > 0 || editingProduct) {
        fd.append('bulkPricing', JSON.stringify(validBulkPricing));
      }
      imageFiles.forEach((file) => fd.append('images', file));
      if (editingProduct && imageFiles.length === 0 && imagePreview.length > 0) {
        fd.append('existingImages', JSON.stringify(imagePreview));
      }

      if (editingProduct) {
        const { data } = await b2bProductAPI.updateProduct(editingProduct._id, fd);
        if (data.product) {
          setProducts((prev) => prev.map((product) => (product._id === data.product._id ? data.product : product)));
        }
        setMessage('B2B Product updated successfully');
      } else {
        const { data } = await b2bProductAPI.createProduct(fd);
        if (data.product) {
          setProducts((prev) => [data.product, ...prev]);
        }
        setMessage('B2B Product created successfully');
      }
      closeModal();
      await loadProducts(page, false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const validationMessage = err.response?.data?.errors?.[0]?.msg;
      const nextMessage = validationMessage || err.response?.data?.message || 'Failed to save B2B product';
      setFormError(nextMessage);
      setMessage(nextMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await b2bProductAPI.deleteProduct(deleteId);
      setDeleteId(null);
      loadProducts();
      setMessage('B2B Product deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete B2B product');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">B2B Products</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add B2B Product</Button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes('success') || message.includes('created') || message.includes('updated') || message.includes('deleted') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search B2B products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Bulk Tiers</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={6} />
              ) : products.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={Package} title="No B2B products found" subtitle="Add B2B products with bulk pricing tiers" /></td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={getProductImage(p) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3"><Badge color={p.status === 'active' ? 'green' : p.status === 'out_of_stock' ? 'red' : 'gray'}>{p.status}</Badge></td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{(p.bulkPricing || []).length} tiers</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            <Button variant="secondary" size="sm" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingProduct ? 'Edit B2B Product' : 'Add B2B Product'} maxWidth="max-w-4xl">
        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {formError}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
          <Input label="Stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
          <Input label="Tax Rate (%)" type="number" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="sm:col-span-2" />

          <div className="sm:col-span-2 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded" />
              Featured
            </label>
          </div>

          {/* ─── Bulk Pricing Section ─── */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Bulk Pricing Tiers</label>
              <button
                type="button"
                onClick={addBulkTier}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </button>
            </div>
            {formData.bulkPricing.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No bulk pricing tiers. Click "Add Tier" to set wholesale prices.</p>
            ) : (
              <div className="space-y-2">
                {formData.bulkPricing.map((tier, index) => (
                  <div key={index} className="grid gap-2 p-3 bg-gray-50 rounded-xl sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Label</label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updateBulkTier(index, 'label', e.target.value)}
                        placeholder="e.g., 10 Boxes"
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] text-gray-500 uppercase">Unit Price (₱)</label>
                      <input
                        type="number"
                        value={tier.unitPrice}
                        onChange={(e) => updateBulkTier(index, 'unitPrice', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] text-gray-500 uppercase">Total Price</label>
                      <input
                        type="number"
                        value={tier.totalPrice || ''}
                        onChange={(e) => updateBulkTier(index, 'totalPrice', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBulkTier(index)}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Images</label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 inline mr-2" /> Choose Images
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <div className="flex gap-2">
                {imagePreview.map((src, i) => (
                  <img key={i} src={getImagePreviewSrc(src)} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete B2B Product" message="Are you sure you want to delete this B2B product? This action cannot be undone." loading={deleteLoading} />
    </div>
  );
};

export default B2BProductsModule;
