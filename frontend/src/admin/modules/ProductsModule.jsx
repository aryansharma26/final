import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, Loader2, Package, X, Star, Download } from 'lucide-react';
import { adminAPI, categoryAPI } from '../../api/index.js';
import { Badge, Button, Input, Select, Textarea, Modal, ConfirmDialog, EmptyState, SkeletonRow } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

const defaultProductForm = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: '',
  discountPrice: '',
  stock: '',
  sku: '',
  productInfo: '',
  keyIngredients: '',
  otherIngredients: '',
  benefits: '',
  goodToKnow: '',
  productForm: '',
  netQty: '',
  directionsForUse: '',
  safetyInfo: '',
  quickTips: '',
  faqs: '',
  dosage: '',
  composition: '',
  isPrescriptionRequired: false,
  featured: false,
  showInOffers: false,
  isPopular: false,
  priority: 0,
  status: 'active',
  bulkPricing: [],
  taxRate: 12,
  searchKeywords: '',
};

const toLines = (value) => (value || []).join('\n');
const faqsToLines = (faqs = []) => faqs.map((faq) => `${faq.question || ''} | ${faq.answer || ''}`).join('\n');

const ProductsModule = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(defaultProductForm);
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [filterParentCategory, setFilterParentCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const filterSubCategories = useMemo(
    () => categories.filter((category) => String(category.parent || '') === String(filterParentCategory || '')),
    [categories, filterParentCategory]
  );

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = { limit: 10000, export: 'true', status: statusFilter };
      if (search) params.search = search;

      const activeCategory = filterSubCategory || filterParentCategory;
      if (activeCategory) params.category = activeCategory;

      const { data } = await adminAPI.getAllProducts(params);
      const allProducts = data.products || [];

      const getCategoryAndSubcategory = (product) => {
        if (!product || !product.category) {
          return { categoryName: 'Uncategorized', subcategoryName: '' };
        }

        // Find the category in the local categories list
        const categoryId = typeof product.category === 'object' ? product.category._id : product.category;
        const cat = categories.find(c => String(c._id) === String(categoryId));

        if (!cat) {
          // Fallback to populated values if available
          if (typeof product.category === 'object') {
            const pCat = product.category;
            if (pCat.parent) {
              const parentName = typeof pCat.parent === 'object' ? pCat.parent.name : pCat.parent;
              // If parent is just an ID, try to find parent name in categories list
              const parentInList = categories.find(c => String(c._id) === String(parentName));
              const finalParentName = parentInList ? parentInList.name : parentName;
              return { categoryName: finalParentName || 'Uncategorized', subcategoryName: pCat.name || '' };
            }
            return { categoryName: pCat.name || 'Uncategorized', subcategoryName: '' };
          }
          return { categoryName: 'Uncategorized', subcategoryName: '' };
        }

        if (cat.parent) {
          // This is a subcategory
          const parentId = typeof cat.parent === 'object' ? cat.parent._id : cat.parent;
          const parentCat = categories.find(c => String(c._id) === String(parentId));
          return {
            categoryName: parentCat ? parentCat.name : (typeof cat.parent === 'object' ? cat.parent.name : cat.parent),
            subcategoryName: cat.name
          };
        } else {
          // This is a parent category
          return {
            categoryName: cat.name,
            subcategoryName: ''
          };
        }
      };

      const headers = [
        'Product Name',
        'SKU',
        'Brand',
        'Category',
        'Subcategory',
        'Price',
        'Discount Price',
        'Stock',
        'Status',
        'Featured',
        'Prescription Required'
      ];

      const mapper = (p) => {
        const { categoryName, subcategoryName } = getCategoryAndSubcategory(p);
        return [
          p.name || '',
          p.sku || '',
          p.brand || '',
          categoryName,
          subcategoryName,
          p.price || 0,
          p.discountPrice || 0,
          p.stock || 0,
          p.status || 'active',
          p.featured ? 'Yes' : 'No',
          p.isPrescriptionRequired ? 'Yes' : 'No'
        ];
      };

      await exportToExcel(allProducts, headers, mapper, 'products_export', 'Products');
    } catch (err) {
      console.error('Failed to export products:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const totalRef = useRef(0);

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent),
    [categories]
  );

  const subCategories = useMemo(
    () => categories.filter((category) => String(category.parent || '') === String(selectedParentCategory || '')),
    [categories, selectedParentCategory]
  );

  const formatCategoryName = (category) => {
    if (!category) return '-';
    if (category.parent?.name) return `${category.parent.name} > ${category.name}`;
    return category.name || '-';
  };

  const loadProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 100, status: statusFilter };
      if (search) params.search = search;

      const activeCategory = filterSubCategory || filterParentCategory;
      if (activeCategory) params.category = activeCategory;

      const { data } = await adminAPI.getAllProducts(params);
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
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, filterParentCategory, filterSubCategory]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadProducts(nextPage, true);
  }, [hasMore, loading, page, loadProducts]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await categoryAPI.getAllCategoriesAdmin();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => { 
    setPage(1);
    loadProducts(1, false); 
  }, [search, statusFilter, filterParentCategory, filterSubCategory, loadProducts]);

  useEffect(() => {
    const editId = localStorage.getItem('editProductId');
    if (editId && products.length > 0) {
      const prod = products.find(p => p._id === editId);
      if (prod) {
        openEdit(prod);
      }
      localStorage.removeItem('editProductId');
    }
  }, [products]);

  const openCreate = () => {
    setEditingProduct(null);
    setFormData(defaultProductForm);
    setSelectedParentCategory('');
    setImageFiles([]);
    setImagePreview([]);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    const productCategory = product.category || {};
    const parentId = productCategory.parent?._id || productCategory.parent || '';
    const categoryId = productCategory._id || product.category || '';
    setSelectedParentCategory(parentId || categoryId || '');
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: parentId ? categoryId : '',
      brand: product.brand || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      stock: product.stock || '',
      sku: product.sku || '',
      productInfo: product.productInfo || '',
      keyIngredients: toLines(product.keyIngredients),
      otherIngredients: toLines(product.otherIngredients),
      benefits: toLines(product.benefits),
      goodToKnow: product.goodToKnow || '',
      productForm: product.productForm || '',
      netQty: product.netQty || '',
      directionsForUse: product.directionsForUse || '',
      safetyInfo: toLines(product.safetyInfo),
      quickTips: toLines(product.quickTips),
      faqs: faqsToLines(product.faqs),
      dosage: product.dosage || '',
      composition: product.composition || '',
      isPrescriptionRequired: product.isPrescriptionRequired || false,
      featured: product.featured || false,
      showInOffers: product.showInOffers || false,
      isPopular: product.isPopular || false,
      priority: product.priority !== undefined ? product.priority : 0,
      status: product.status || 'active',
      bulkPricing: product.bulkPricing || [],
      taxRate: product.taxRate !== undefined ? product.taxRate : 12,
      searchKeywords: toLines(product.searchKeywords),
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
      if (src.startsWith('blob:')) URL.revokeObjectURL(src);
    });
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreview(previews);
  };

  const closeModal = () => {
    imagePreview.forEach((src) => {
      if (src.startsWith('blob:')) URL.revokeObjectURL(src);
    });
    setImagePreview([]);
    setModalOpen(false);
  };

  // ─── Bulk Pricing Handlers ───
  const addBulkTier = () => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: [...prev.bulkPricing, { minQty: '', maxQty: '', unitPrice: '', label: '' }],
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
      if (!selectedParentCategory) {
        setFormError('Please select a category');
        return;
      }
      if (subCategories.length > 0 && !formData.category) {
        setFormError('Please select a subcategory');
        return;
      }

      setSubmitting(true);
      setFormError('');
      const fd = new FormData();
      const multilineFields = ['benefits', 'keyIngredients', 'otherIngredients', 'safetyInfo', 'quickTips', 'searchKeywords'];
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'category') return;
        if (multilineFields.includes(key) || key === 'faqs' || key === 'bulkPricing') return;
        const shouldSendEmpty = editingProduct && ['description', 'productInfo', 'goodToKnow', 'productForm', 'netQty', 'directionsForUse', 'dosage', 'composition'].includes(key);
        if (value !== undefined && value !== null && (value !== '' || shouldSendEmpty)) {
          fd.append(key, value);
        }
      });
      const selectedCategory = formData.category || selectedParentCategory;
      if (selectedCategory) {
        fd.append('category', selectedCategory);
      }
      multilineFields.forEach((field) => {
        const items = formData[field].split(/\r?\n|,/ ).map((item) => item.trim()).filter(Boolean);
        if (editingProduct && items.length === 0) {
          fd.append(field, '');
        } else {
          items.forEach((item) => fd.append(field, item));
        }
      });
      const faqs = formData.faqs
        .split(/\r?\n/)
        .map((line) => {
          const [question, ...answerParts] = line.split('|');
          return { question: question?.trim() || '', answer: answerParts.join('|').trim() };
        })
        .filter((faq) => faq.question && faq.answer);
      if (faqs.length > 0 || editingProduct) {
        fd.append('faqs', JSON.stringify(faqs));
      }
      // Bulk pricing
      const validBulkPricing = (formData.bulkPricing || []).filter(
        (t) => t.minQty && t.unitPrice
      );
      if (validBulkPricing.length > 0 || editingProduct) {
        fd.append('bulkPricing', JSON.stringify(validBulkPricing));
      }
      imageFiles.forEach((file) => fd.append('images', file));
      if (editingProduct && imageFiles.length === 0 && imagePreview.length > 0) {
        fd.append('existingImages', JSON.stringify(imagePreview));
      }

      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct._id, fd);
        setMessage('Product updated successfully');
      } else {
        await adminAPI.createProduct(fd);
        setMessage('Product created successfully');
      }
      closeModal();
      loadProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const nextMessage = err.response?.data?.message || 'Failed to save product';
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
      await adminAPI.deleteProduct(deleteId);
      setDeleteId(null);
      loadProducts();
      setMessage('Product deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Product</Button>
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
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'out_of_stock', label: 'Out of Stock' },
          ]}
        />
        <Select
          value={filterParentCategory}
          onChange={(e) => {
            setFilterParentCategory(e.target.value);
            setFilterSubCategory('');
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Categories' },
            ...parentCategories.map((c) => ({ value: c._id, label: c.name }))
          ]}
        />
        <Select
          value={filterSubCategory}
          onChange={(e) => {
            setFilterSubCategory(e.target.value);
            setPage(1);
          }}
          disabled={!filterParentCategory || filterSubCategories.length === 0}
          options={[
            { value: '', label: filterSubCategories.length > 0 ? 'All Subcategories' : 'No subcategories' },
            ...filterSubCategories.map((c) => ({ value: c._id, label: c.name }))
          ]}
        />
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exportLoading}
          className="pressable inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark focus:outline-none transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer h-[38px] sm:h-auto"
        >
          {exportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Download className="w-4 h-4 text-white/80" />
          )}
          Export Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={6} />
              ) : products.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Package} title="No products found" subtitle="Try adjusting your search or filters" /></td></tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => openEdit(p)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 leading-tight">{p.name}</p>
                            {p.featured && (
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 shrink-0" title="Featured product" />
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-gray-500">
                            <span>{p.brand || 'No brand'}</span>
                            <span className="text-gray-300">|</span>
                            <span>SKU: {p.sku || 'N/A'}</span>
                            <span className="text-gray-300">|</span>
                            <span>ID: {p._id}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.isPrescriptionRequired && <Badge color="yellow">Rx</Badge>}
                            {p.showInOffers && <Badge color="blue">Offer</Badge>}
                            {p.isPopular && <Badge color="green">Popular</Badge>}
                            {p.priority > 0 && <Badge color="gray">Priority {p.priority}</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">₱{p.discountPrice || p.price}</p>
                      {p.discountPrice > 0 && <p className="text-xs text-gray-400 line-through">₱{p.price}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        p.stock === 0 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : p.stock <= 15 
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.stock === 0 ? 'bg-red-500' : p.stock <= 15 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></span>
                        {p.stock === 0 ? 'Out of stock' : p.stock <= 15 ? `${p.stock} Low Stock` : `${p.stock} In Stock`}
                      </span>
                    </td>
                    <td className="px-4 py-3"><Badge color={p.status === 'active' ? 'green' : p.status === 'out_of_stock' ? 'red' : 'gray'}>{p.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.category ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {p.category.parent && (
                            <>
                              <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold text-gray-650">
                                {p.category.parent.name || p.category.parent}
                              </span>
                              <span className="text-gray-400 text-xs">→</span>
                            </>
                          )}
                          <span className="inline-block px-1.5 py-0.5 rounded bg-brand/5 text-[10px] font-bold text-brand border border-brand/10">
                            {p.category.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={closeModal} title={editingProduct ? 'Edit Product' : 'Add Product'} maxWidth="max-w-4xl">
        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {formError}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
          <Select
            label="Category"
            value={selectedParentCategory}
            onChange={(e) => {
              setSelectedParentCategory(e.target.value);
              setFormData({ ...formData, category: '' });
            }}
            options={[{ value: '', label: 'Select Category' }, ...parentCategories.map((c) => ({ value: c._id, label: c.name }))]}
          />
          <Select
            label="Subcategory"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={!selectedParentCategory || subCategories.length === 0}
            options={[
              { value: '', label: subCategories.length > 0 ? 'Select Subcategory' : 'No subcategories' },
              ...subCategories.map((c) => ({ value: c._id, label: c.name })),
            ]}
          />
          <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'out_of_stock', label: 'Out of Stock' }]} />
          <Input label="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          <Input label="Discount Price" type="number" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })} />
          <Input label="Stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
          <Input label="Tax Rate (%)" type="number" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} />
          <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="sm:col-span-2" />
          <Textarea label="Product Information" value={formData.productInfo} onChange={(e) => setFormData({ ...formData, productInfo: e.target.value })} className="sm:col-span-2" />
          <Textarea label="Key Ingredients (one per line)" value={formData.keyIngredients} onChange={(e) => setFormData({ ...formData, keyIngredients: e.target.value })} />
          <Textarea label="Other Ingredients (one per line)" value={formData.otherIngredients} onChange={(e) => setFormData({ ...formData, otherIngredients: e.target.value })} />
          <Textarea label="Benefits (one per line)" value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} className="sm:col-span-2" />
          <Textarea label="Good to Know" value={formData.goodToKnow} onChange={(e) => setFormData({ ...formData, goodToKnow: e.target.value })} className="sm:col-span-2" />
          <Input label="Product Form" value={formData.productForm} onChange={(e) => setFormData({ ...formData, productForm: e.target.value })} />
          <Input label="Net Qty" value={formData.netQty} onChange={(e) => setFormData({ ...formData, netQty: e.target.value })} />
          <Textarea label="Directions for Use" value={formData.directionsForUse} onChange={(e) => setFormData({ ...formData, directionsForUse: e.target.value })} className="sm:col-span-2" />
          <Textarea label="Safety Information (one per line)" value={formData.safetyInfo} onChange={(e) => setFormData({ ...formData, safetyInfo: e.target.value })} />
          <Textarea label="Quick Tips (one per line)" value={formData.quickTips} onChange={(e) => setFormData({ ...formData, quickTips: e.target.value })} />
          <Textarea label="FAQs (Question | Answer, one per line)" value={formData.faqs} onChange={(e) => setFormData({ ...formData, faqs: e.target.value })} className="sm:col-span-2" />
          <Textarea label="Search Keywords / Aliases (synonyms, common mistypes, comma separated)" value={formData.searchKeywords} onChange={(e) => setFormData({ ...formData, searchKeywords: e.target.value })} className="sm:col-span-2" />
          <Input label="Dosage" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
          <Input label="Composition" value={formData.composition} onChange={(e) => setFormData({ ...formData, composition: e.target.value })} />
          <div className="sm:col-span-2 flex flex-wrap items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" checked={formData.isPrescriptionRequired} onChange={(e) => setFormData({ ...formData, isPrescriptionRequired: e.target.checked })} className="rounded text-brand focus:ring-brand" />
              Prescription Required
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded text-brand focus:ring-brand" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" checked={formData.showInOffers} onChange={(e) => setFormData({ ...formData, showInOffers: e.target.checked })} className="rounded text-brand focus:ring-brand" />
              Show in Offers Page
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} className="rounded text-brand focus:ring-brand" />
              Show in Popular Products
            </label>
          </div>
          <div className="sm:col-span-2">
            <Input
              type="number"
              label="Sort Priority Order (Higher priority numbers display first under category/subcategory lists by default)"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              min="0"
              placeholder="e.g. 10"
            />
          </div>

          {/* ─── Bulk Pricing Section ─── */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Bulk / Group Offers</label>
              <button
                type="button"
                onClick={addBulkTier}
                className="pressable inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tier
              </button>
            </div>
            {formData.bulkPricing.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No bulk pricing tiers. Click "Add Tier" to set wholesale prices.</p>
            ) : (
              <div className="space-y-2">
                {formData.bulkPricing.map((tier, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
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
                    <div className="w-20">
                      <label className="text-[10px] text-gray-500 uppercase">Min Qty</label>
                      <input
                        type="number"
                        value={tier.minQty}
                        onChange={(e) => updateBulkTier(index, 'minQty', e.target.value)}
                        placeholder="10"
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] text-gray-500 uppercase">Max Qty</label>
                      <input
                        type="number"
                        value={tier.maxQty}
                        onChange={(e) => updateBulkTier(index, 'maxQty', e.target.value)}
                        placeholder="∞"
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
                    <button
                      type="button"
                      onClick={() => removeBulkTier(index)}
                      className="mt-4 p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
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
                  <img key={i} src={src} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => closeModal}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Product" message="Are you sure you want to delete this product? This action cannot be undone." loading={deleteLoading} />
    </div>
  );
};

export default ProductsModule;
