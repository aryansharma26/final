import { Fragment, useEffect, useMemo, useState } from 'react';
import { Edit2, FolderTree, Loader2, Plus, Trash2, Download } from 'lucide-react';
import { b2bCategoryAPI } from '../../api/index.js';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, Select, SkeletonRow, Textarea } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';

const emptyForm = {
  name: '',
  parent: '',
  description: '',
  order: '',
  isActive: true,
};

const B2BCategoriesModule = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      
      const exportData = [];
      parentCategories.forEach(parent => {
        exportData.push({
          category: parent.name,
          subcategory: '',
          productCount: parent.productCount || 0,
          isActive: parent.isActive !== false ? 'Active' : 'Inactive',
          description: parent.description || ''
        });
        
        const children = categoriesByParent[String(parent._id)] || [];
        children.forEach(child => {
          exportData.push({
            category: parent.name,
            subcategory: child.name,
            productCount: child.productCount || 0,
            isActive: child.isActive !== false ? 'Active' : 'Inactive',
            description: child.description || ''
          });
        });
      });

      const headers = ['Category', 'Subcategory', 'Product Count', 'Status', 'Description'];
      const mapper = (c) => [
        c.category,
        c.subcategory,
        c.productCount,
        c.isActive,
        c.description
      ];

      await exportToExcel(exportData, headers, mapper, 'b2b_categories_export', 'B2B Categories');
    } catch (err) {
      console.error('Failed to export B2B categories:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent),
    [categories]
  );

  const categoriesByParent = useMemo(() => {
    return categories.reduce((acc, category) => {
      const parentId = category.parent ? String(category.parent) : null;
      if (parentId) {
        acc[parentId] = [...(acc[parentId] || []), category];
      }
      return acc;
    }, {});
  }, [categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data } = await b2bCategoryAPI.getAllCategoriesAdmin();
      setCategories(data.categories || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load B2B categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const openCreate = (parent = '') => {
    setEditingCategory(null);
    setFormData({ ...emptyForm, parent });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      parent: category.parent || '',
      description: category.description || '',
      order: category.order ?? '',
      isActive: category.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        parent: formData.parent || null,
        order: formData.order === '' ? 0 : Number(formData.order),
      };

      if (editingCategory) {
        await b2bCategoryAPI.updateCategory(editingCategory._id, payload);
        showMessage('B2B Category updated successfully');
      } else {
        await b2bCategoryAPI.createCategory(payload);
        showMessage('B2B Category created successfully');
      }

      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to save B2B category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await b2bCategoryAPI.deleteCategory(deleteId);
      setDeleteId(null);
      showMessage('B2B Category deleted successfully');
      await loadCategories();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete B2B category');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDeleteMessage = () => {
    const category = categories.find((item) => item._id === deleteId);
    if (!category) return 'Are you sure you want to delete this B2B category?';
    const childCount = categoriesByParent[String(category._id)]?.length || 0;
    if (childCount > 0) {
      return `Delete "${category.name}" and its ${childCount} subcategories? B2B products inside them will be marked inactive.`;
    }
    return `Delete "${category.name}"? B2B products inside it will be marked inactive.`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage parent categories and subcategories shown across the B2B portal.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCreate()}><Plus className="w-4 h-4" /> Add Category</Button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="pressable inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark focus:outline-none transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
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

      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes('success') || message.includes('created') || message.includes('updated') || message.includes('deleted') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">B2B Products</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={5} count={4} />
              ) : parentCategories.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={FolderTree} title="No B2B categories found" subtitle="Create your first B2B category to start organizing wholesale products." /></td></tr>
              ) : (
                parentCategories.map((category) => {
                  const children = categoriesByParent[String(category._id)] || [];

                  return (
                    <Fragment key={category._id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{category.description}</p>}
                        </td>
                        <td className="px-4 py-3"><Badge color="blue">Category</Badge></td>
                        <td className="px-4 py-3 text-gray-600">{category.productCount || 0}</td>
                        <td className="px-4 py-3"><Badge color={category.isActive === false ? 'gray' : 'green'}>{category.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openCreate(category._id)} className="pressable p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Add subcategory"><Plus className="w-4 h-4" /></button>
                            <button onClick={() => openEdit(category)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Edit category"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteId(category._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete category"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                      {children.map((child) => (
                        <tr key={child._id} className="border-b border-gray-50 bg-gray-50/30 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="pl-6 flex items-start gap-2">
                              <span className="text-gray-400 font-mono select-none">└─</span>
                              <div>
                                <p className="font-semibold text-gray-800 leading-tight">{child.name}</p>
                                {child.description && <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{child.description}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge color="teal">Subcategory</Badge></td>
                          <td className="px-4 py-3 text-gray-600">{child.productCount || 0}</td>
                          <td className="px-4 py-3"><Badge color={child.isActive === false ? 'gray' : 'green'}>{child.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEdit(child)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Edit subcategory"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => setDeleteId(child._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete subcategory"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? 'Edit B2B Category' : 'Add B2B Category'} maxWidth="max-w-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Select
            label="Parent Category"
            value={formData.parent}
            onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
            disabled={!!editingCategory && categoriesByParent[String(editingCategory._id)]?.length > 0}
            options={[
              { value: '', label: 'None (main category)' },
              ...parentCategories
                .filter((category) => category._id !== editingCategory?._id)
                .map((category) => ({ value: category._id, label: category.name })),
            ]}
          />
          <Input label="Order" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} />
          <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="sm:col-span-2" />
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
            Active
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message={getDeleteMessage()} loading={deleteLoading} />
    </div>
  );
};

export default B2BCategoriesModule;
