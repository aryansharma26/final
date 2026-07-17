import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, BadgeCheck, Camera, CheckCircle, ClipboardCheck, Clock, Download, Eye, FileText, Loader2, MapPin, MessageCircle, Pencil, Plus, RotateCw, Trash2, Truck, Upload, X, XCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { prescriptionAPI, userAPI } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { compressPrescriptionFile } from '../utils/prescriptionFiles.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const emptyAddress = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  province: '',
  cityMunicipality: '',
  barangay: '',
  zipCode: '',
  country: 'Philippines',
  isDefault: false,
};

const isCompleteAddress = (address) =>
  Boolean(
    address?.name?.trim() &&
    address?.phone?.trim() &&
    address?.addressLine1?.trim() &&
    address?.barangay?.trim() &&
    address?.cityMunicipality?.trim() &&
    address?.province?.trim() &&
    address?.zipCode?.trim() &&
    /^\d{4}$/.test(address?.zipCode?.trim())
  );

const statusStyles = {
  pending: { icon: Clock, className: 'bg-yellow-50 text-yellow-700 border-yellow-100', label: 'Pending review' },
  approved: { icon: CheckCircle, className: 'bg-green-50 text-green-700 border-green-100', label: 'Approved' },
  rejected: { icon: XCircle, className: 'bg-red-50 text-red-700 border-red-100', label: 'Rejected' },
};

const formatSize = (bytes = 0) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatAddress = (address = {}) => [
  address.addressLine1,
  address.addressLine2,
  address.barangay,
  address.cityMunicipality,
  address.province,
  address.zipCode,
].filter(Boolean).join(', ');

const Prescriptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingSource, setUploadingSource] = useState('');
  const [message, setMessage] = useState('');
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [pendingUploadSource, setPendingUploadSource] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [viewingId, setViewingId] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [orderingId, setOrderingId] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const uploading = Boolean(uploadingSource);

  const loadAddresses = async () => {
    try {
      const { data } = await userAPI.getProfile();
      const userAddresses = data.user?.addresses || [];
      setAddresses(userAddresses);
      const defaultAddress = userAddresses.find((address) => address.isDefault) || userAddresses[0];
      if (defaultAddress) setSelectedAddress(defaultAddress._id);
    } catch {
      // Keep upload page usable even if profile refresh fails.
    }
  };

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const { data } = await prescriptionAPI.getMyPrescriptions();
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPrescriptions();
      loadAddresses();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const resetInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const selectedDeliveryAddress = addresses.find((address) => address._id === selectedAddress);

  const validateAddress = (address = selectedDeliveryAddress) => {
    if (!address) {
      setMessage('Please select a delivery address before uploading your prescription.');
      return false;
    }
    if (!isCompleteAddress(address)) {
      setMessage('Please edit your selected address and ensure all required fields are filled. ZIP code must be exactly 4 digits.');
      return false;
    }
    return true;
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ ...emptyAddress, name: user?.name || '', phone: user?.phone || '' });
    setFormError('');
    setShowAddressForm(true);
  };

  const openEditAddress = (address) => {
    setEditingAddress(address._id);
    setAddressForm({
      ...emptyAddress,
      ...address,
      country: address.country || 'Philippines',
      isDefault: Boolean(address.isDefault),
    });
    setFormError('');
    setShowAddressForm(true);
  };

  const saveAddress = async () => {
    setFormError('');
    if (!isCompleteAddress(addressForm)) {
      setFormError('Please fill all required fields. ZIP code must be exactly 4 digits.');
      return;
    }
    try {
      setFormLoading(true);
      const { data } = editingAddress
        ? await userAPI.updateAddress(editingAddress, addressForm)
        : await userAPI.addAddress(addressForm);
      const nextAddresses = data.addresses || [];
      setAddresses(nextAddresses);
      const selected = editingAddress || nextAddresses.at(-1)?._id || nextAddresses.find((address) => address.isDefault)?._id || nextAddresses[0]?._id;
      if (selected) setSelectedAddress(selected);
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm(emptyAddress);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      setDeletingId(id);
      const { data } = await userAPI.deleteAddress(id);
      const nextAddresses = data.addresses || [];
      setAddresses(nextAddresses);
      if (selectedAddress === id) {
        setSelectedAddress(nextAddresses.find((address) => address.isDefault)?._id || nextAddresses[0]?._id || '');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeletingId('');
    }
  };

  const triggerPicker = (source) => {
    setMessage('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const uploadFile = async (file, source = 'file', address = selectedDeliveryAddress) => {
    if (!validateAddress(address)) return;
    try {
      setUploadingSource(source);
      setMessage('');
      const formData = new FormData();
      formData.append('prescription', file);
      formData.append('deliveryAddress', JSON.stringify(address));
      await prescriptionAPI.uploadPrescription(formData);
      setPendingUploadFile(null);
      setPendingUploadSource('');
      setShowAddressModal(false);
      resetInputs();
      setMessage('Prescription uploaded successfully. Our pharmacist will review it and contact you for medicine fulfilment.');
      await loadPrescriptions();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Prescription upload failed');
    } finally {
      setUploadingSource('');
    }
  };

  const chooseFile = async (file, source = 'file') => {
    setMessage('');
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPG, PNG, and PDF files are allowed');
      resetInputs();
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage('File size must be 10MB or less');
      resetInputs();
      return;
    }
    try {
      const uploadReadyFile = await compressPrescriptionFile(file);
      if (uploadReadyFile.size > MAX_FILE_SIZE) {
        setMessage('File size must be 10MB or less');
        resetInputs();
        return;
      }
      setPendingUploadFile(uploadReadyFile);
      setPendingUploadSource(source);
      setShowAddressModal(true);
    } catch {
      setMessage('Could not prepare this prescription file');
      resetInputs();
    }
  };

  const cancelPendingUpload = () => {
    setPendingUploadFile(null);
    setPendingUploadSource('');
    setShowAddressModal(false);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setFormError('');
    resetInputs();
  };

  const confirmPendingUpload = async () => {
    if (!pendingUploadFile) return;
    await uploadFile(pendingUploadFile, pendingUploadSource || 'file', selectedDeliveryAddress);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewItem(null);
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const openBlob = (response, item) => {
    const blob = new Blob([response.data], { type: item.fileType || response.headers?.['content-type'] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setPreviewItem(item);
  };

  const handleView = async (item) => {
    try {
      setViewingId(item._id);
      setMessage('');
      const response = await prescriptionAPI.viewMyPrescription(item._id);
      openBlob(response, item);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Prescription view failed');
    } finally {
      setViewingId('');
    }
  };

  const handleDownload = async (item) => {
    try {
      setDownloadingId(item._id);
      setMessage('');
      const response = await prescriptionAPI.downloadMyPrescription(item._id);
      const blob = new Blob([response.data], { type: item.fileType || response.headers?.['content-type'] || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.originalFileName || 'prescription';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Prescription download failed');
    } finally {
      setDownloadingId('');
    }
  };

  const handlePlaceQuoteOrder = async (item) => {
    try {
      setOrderingId(item._id);
      setMessage('');
      const { data } = await prescriptionAPI.createOrderFromQuote(item._id);
      navigate(`/orders/${data.order._id}?success=true`, { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to place prescription order');
    } finally {
      setOrderingId('');
    }
  };

  return (
    <div className="container-custom py-6 lg:py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-6 overflow-hidden rounded-2xl border border-brand/10 bg-[#f7f8f3] shadow-sm">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand shadow-sm">
              <FileText className="h-3.5 w-3.5" />
              Prescription Service
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
              Upload Your Prescription and Get Your Medicines at Your Doorstep.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Add your delivery address and upload a clear photo or PDF of your prescription. Our licensed pharmacists will carefully review it, prepare your order, and deliver your medicines safely to your doorstep.
            </p>

            <div className="mt-5 grid gap-2 sm:flex">
              <button
                type="button"
                onClick={() => triggerPicker('camera')}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-gray-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {uploadingSource === 'camera' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => triggerPicker('file')}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {uploadingSource === 'file' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Choose File
              </button>
              <button
                type="button"
                onClick={loadPrescriptions}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition-colors hover:border-brand/30 hover:text-brand"
              >
                <RotateCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-950">Review flow</p>
                <p className="text-xs text-gray-500">Simple, checked, delivered</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ['Upload', 'Prescription photo or PDF'],
                ['Review', 'Pharmacist validates medicines'],
                ['Confirm', 'You approve quote and delivery'],
              ].map(([title, copy], index) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">{index + 1}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-5 rounded-xl p-3 text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => chooseFile(event.target.files?.[0], 'file')} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => chooseFile(event.target.files?.[0], 'camera')} className="hidden" />

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Prescription History</h2>
            <p className="text-sm text-gray-500">{prescriptions.length} file{prescriptions.length === 1 ? '' : 's'} uploaded</p>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3 p-4 sm:p-5">
            {[1, 2].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            {isAuthenticated ? (
              <>
                <p className="font-semibold text-gray-900">No prescriptions uploaded yet</p>
                <p className="mt-1 text-sm text-gray-500">Your uploaded prescriptions will appear here.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-900">Sign in to view your prescription history</p>
                <p className="mt-1 text-sm text-gray-500">Upload and manage your prescriptions after signing in.</p>
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: location } })}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prescriptions.map((item) => {
              const status = statusStyles[item.status] || statusStyles.pending;
              const Icon = status.icon;
              return (
                <div key={item._id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">{item.originalFileName}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatSize(item.fileSize)} | Uploaded {new Date(item.uploadedAt || item.createdAt).toLocaleDateString()}
                    </p>
                    {item.requestedProduct && <p className="mt-1 text-xs text-brand">For: {item.requestedProduct.name}</p>}
                    {formatAddress(item.deliveryAddress) && <p className="mt-1 line-clamp-1 text-xs text-gray-500">Deliver to: {formatAddress(item.deliveryAddress)}</p>}
                    {item.quoteStatus === 'sent' && item.quoteItems?.length > 0 && (
                      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Medicine quote ready</p>
                        <div className="mt-2 space-y-2">
                          {item.quoteItems.map((quoteItem, index) => (
                            <div key={`${quoteItem.product?._id || quoteItem.product}-${index}`} className="flex justify-between gap-3 text-xs text-gray-700">
                              <span className="line-clamp-1">{quoteItem.name} x{quoteItem.quantity}</span>
                              <span className="font-bold">PHP {(Number(quoteItem.price || 0) * Number(quoteItem.quantity || 1)).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        {item.quoteNotes && <p className="mt-2 text-xs text-gray-600">{item.quoteNotes}</p>}
                        <button
                          type="button"
                          onClick={() => handlePlaceQuoteOrder(item)}
                          disabled={orderingId === item._id}
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
                        >
                          {orderingId === item._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          Place Order
                        </button>
                      </div>
                    )}
                    {item.quoteStatus === 'accepted' && (
                      <p className="mt-2 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">Quote accepted and order placed</p>
                    )}
                    {item.adminNotes && <p className="mt-2 text-sm text-gray-600">{item.adminNotes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                    <button type="button" onClick={() => handleView(item)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-brand/30 hover:text-brand">
                      {viewingId === item._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                      View
                    </button>
                    <button type="button" onClick={() => handleDownload(item)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800">
                      {downloadingId === item._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: FileText, title: 'Upload clear file', copy: 'Doctor name, medicine, and dosage should be readable.' },
          { icon: MapPin, title: 'Address in popup', copy: 'Delivery address is selected after choosing the file or photo.' },
          { icon: BadgeCheck, title: 'Pharmacist review', copy: 'We confirm details before preparing the quote.' },
        ].map(({ icon: Icon, title, copy }) => (
          <div key={title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-gray-950">{title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">{copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-brand/10 bg-brand px-5 py-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <MessageCircle className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-sm font-bold">Need help reading your prescription?</p>
              <p className="mt-1 text-xs leading-5 text-white/75">Upload the clearest image you have. Our team will contact you if anything needs confirmation.</p>
            </div>
          </div>
        </div>
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <button
            type="button"
            className="absolute inset-0 bg-gray-950/60"
            onClick={closePreview}
            aria-label="Close preview"
          />
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-950">{previewItem.originalFileName}</p>
                <p className="text-xs text-gray-500">{previewItem.fileType}</p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-[55vh] overflow-auto bg-gray-50 p-3 sm:p-4">
              {previewItem.fileType === 'application/pdf' ? (
                <iframe src={previewUrl} title="Prescription PDF" className="h-[72vh] w-full rounded-xl bg-white" />
              ) : (
                <img src={previewUrl} alt="Prescription preview" className="mx-auto max-h-[72vh] w-full rounded-xl object-contain" />
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
              <button type="button" onClick={closePreview} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Close
              </button>
              <button type="button" onClick={() => handleDownload(previewItem)} className="inline-flex items-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <button
            type="button"
            className="absolute inset-0 bg-gray-950/60"
            onClick={uploading ? undefined : cancelPendingUpload}
            aria-label="Close address selector"
          />
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-brand-light p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-950">Choose delivery address</p>
                  <p className="truncate text-sm text-gray-500">
                    {pendingUploadFile?.name ? `For ${pendingUploadFile.name}` : 'Select where this prescription order should be delivered.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelPendingUpload}
                disabled={uploading}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-auto p-4 sm:p-5">
              {addresses.length === 0 && !showAddressForm ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <MapPin className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-900">No saved address</p>
                  <p className="mt-1 text-sm text-gray-500">Add a delivery address before uploading your prescription.</p>
                  <button type="button" onClick={openAddAddress} className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <div key={address._id} className={`rounded-2xl border p-4 transition-colors ${selectedAddress === address._id ? 'border-brand bg-brand/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                      <label className="block cursor-pointer">
                        <input type="radio" name="modalDeliveryAddress" value={address._id} checked={selectedAddress === address._id} onChange={() => setSelectedAddress(address._id)} className="sr-only" />
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-950">{address.name}</p>
                            <p className="text-xs text-gray-500">{address.phone}</p>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">
                              {address.addressLine1}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                              <br />
                              {address.barangay}, {address.cityMunicipality}, {address.province} - {address.zipCode}
                            </p>
                            {address.isDefault && <span className="mt-2 inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">Default</span>}
                          </div>
                          {selectedAddress === address._id && <CheckCircle className="h-5 w-5 shrink-0 text-brand" />}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {showAddressForm ? (
                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {formError && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} placeholder="Full name" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    <input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="Phone number" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    <input value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} placeholder="Street address, house number" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:col-span-2" />
                    <input value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} placeholder="Apartment, landmark (optional)" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:col-span-2" />
                    <input value={addressForm.barangay} onChange={(e) => setAddressForm({ ...addressForm, barangay: e.target.value })} placeholder="Barangay" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    <input value={addressForm.cityMunicipality} onChange={(e) => setAddressForm({ ...addressForm, cityMunicipality: e.target.value })} placeholder="City / Municipality" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    <input value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} placeholder="Province" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    <input value={addressForm.zipCode} onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })} placeholder="ZIP code" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="rounded text-brand focus:ring-brand" />
                      Set as default address
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddressForm(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white">Cancel</button>
                    <button type="button" onClick={saveAddress} disabled={formLoading} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                      {formLoading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </div>
              ) : (
                addresses.length > 0 && (
                  <button type="button" onClick={openAddAddress} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-brand/30 hover:text-brand">
                    <Plus className="h-3.5 w-3.5" />
                    Add another address
                  </button>
                )
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={cancelPendingUpload}
                disabled={uploading}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingUpload}
                disabled={uploading || !selectedDeliveryAddress || !isCompleteAddress(selectedDeliveryAddress)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
