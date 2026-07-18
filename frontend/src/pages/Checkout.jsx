import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Truck, MapPin, CheckCircle, ArrowLeft, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, FileText, Upload, Loader2, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { userAPI, orderAPI, b2bCouponAPI, couponAPI } from '../api/index.js';

const emptyAddress = {
  name: '',
  phone: '',
  addressLine1: '',
  barangay: '',
  cityMunicipality: '',
  province: '',
  zipCode: '',
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

const Checkout = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [b2bItem] = useState(() => {
    if (location.state?.b2bItem) return location.state.b2bItem;
    try {
      return JSON.parse(sessionStorage.getItem('pendingB2BCheckout') || 'null');
    } catch {
      return null;
    }
  });
  const [buyNowItem] = useState(() => {
    if (location.state?.buyNowItem) return location.state.buyNowItem;
    try {
      return JSON.parse(sessionStorage.getItem('pendingBuyNowCheckout') || 'null');
    } catch {
      return null;
    }
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [isSenior, setIsSenior] = useState(false);
  const [seniorDocUrl, setSeniorDocUrl] = useState('');
  const [uploadingSeniorDoc, setUploadingSeniorDoc] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [b2bCouponCode, setB2BCouponCode] = useState('');
  const [b2bCoupon, setB2BCoupon] = useState(null);
  const [b2bCouponDiscount, setB2BCouponDiscount] = useState(0);
  const [b2bCouponMessage, setB2BCouponMessage] = useState('');
  const [b2bCouponLoading, setB2BCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleSeniorCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsSenior(checked);
    if (!checked) {
      setSeniorDocUrl('');
      setUploadError('');
    }
  };

  const handleSeniorDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingSeniorDoc(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('prescription', file);
      
      const { data } = await orderAPI.uploadSeniorDoc(formData);
      if (data.success) {
        setSeniorDocUrl(data.url);
      } else {
        setUploadError(data.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingSeniorDoc(false);
    }
  };
  
  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout', { replace: true });
      return;
    }
    loadAddresses();
  }, [user, navigate]);

  const loadAddresses = async () => {
    try {
      const { data } = await userAPI.getProfile();
      const addrs = data.user.addresses || [];
      setAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr._id);
      else if (addrs.length > 0) setSelectedAddress(addrs[0]._id);
    } catch {
      // ignore
    }
  };

  const handleOpenAddForm = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setFormError('');
    setShowAddressForm(true);
  };

  const handleOpenEditForm = (addr) => {
    setEditingAddress(addr._id);
    setAddressForm({
      name: addr.name || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      barangay: addr.barangay || '',
      cityMunicipality: addr.cityMunicipality || '',
      province: addr.province || '',
      zipCode: addr.zipCode || '',
      isDefault: addr.isDefault || false,
    });
    setFormError('');
    setShowAddressForm(true);
  };

  const handleCloseForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validate
    if (!addressForm.name?.trim() || !addressForm.phone?.trim() || !addressForm.addressLine1?.trim() || !addressForm.barangay?.trim() || !addressForm.cityMunicipality?.trim() || !addressForm.province?.trim() || !addressForm.zipCode?.trim()) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (!/^\d{4}$/.test(addressForm.zipCode.trim())) {
      setFormError('Philippines zip code must be exactly 4 digits (e.g. 1000)');
      return;
    }
    
    try {
      setFormLoading(true);
      if (editingAddress) {
        const { data } = await userAPI.updateAddress(editingAddress, addressForm);
        setAddresses(data.addresses);
      } else {
        const { data } = await userAPI.addAddress(addressForm);
        setAddresses(data.addresses);
      }
      handleCloseForm();
      await loadAddresses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      setDeletingId(id);
      const { data } = await userAPI.deleteAddress(id);
      setAddresses(data.addresses);
      if (selectedAddress === id) {
        const remaining = data.addresses;
        const defaultAddr = remaining.find((a) => a.isDefault);
        setSelectedAddress(defaultAddr?._id || remaining[0]?._id || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const { checkoutDiscount } = useSettings();
  const isBuyNow = Boolean(buyNowItem);
  const checkoutSubtotal = b2bItem 
    ? b2bItem.totalPrice 
    : isBuyNow 
      ? buyNowItem.price * buyNowItem.quantity 
      : subtotal;

  const shipping = (b2bItem || isBuyNow) 
    ? (checkoutSubtotal >= 2000 ? 0 : 50) 
    : (subtotal >= 2000 ? 0 : 50);

  const itemTaxRate = (b2bItem && b2bItem.taxRate !== undefined) 
    ? b2bItem.taxRate 
    : (isBuyNow && buyNowItem.taxRate !== undefined) 
      ? buyNowItem.taxRate 
      : 12;

  const seniorDiscountActive = !b2bItem && isSenior && seniorDocUrl;
  const getSeniorPrice = (price) => seniorDiscountActive ? Number((Number(price || 0) * 0.80).toFixed(2)) : Number(price || 0);

  const tax = b2bItem
    ? Number((checkoutSubtotal * (itemTaxRate / (100 + itemTaxRate))).toFixed(2))
    : isBuyNow
      ? Number((getSeniorPrice(buyNowItem.price) * buyNowItem.quantity * (itemTaxRate / (100 + itemTaxRate))).toFixed(2))
      : Number(
          (cart.items || []).reduce((sum, item) => {
            const rate = item.product?.taxRate !== undefined ? item.product.taxRate : 12;
            return sum + (getSeniorPrice(item.price) * item.quantity) * (rate / (100 + rate));
          }, 0).toFixed(2)
        );

  const discount = b2bItem 
    ? b2bCouponDiscount 
    : isBuyNow 
      ? couponDiscount 
      : (cart.couponDiscount || 0);

  const seniorDiscount = seniorDiscountActive ? Number((checkoutSubtotal * 0.20).toFixed(2)) : 0;

  let checkoutOfferDiscount = 0;
  if (!b2bItem && checkoutDiscount?.enabled && checkoutSubtotal >= checkoutDiscount.minOrderAmount) {
    checkoutOfferDiscount = Number((checkoutSubtotal * (checkoutDiscount.discountPercentage / 100)).toFixed(2));
  }

  const total = b2bItem 
    ? Math.max(0, checkoutSubtotal + shipping - discount) 
    : Math.max(0, checkoutSubtotal + shipping - discount - seniorDiscount - checkoutOfferDiscount);

  const handleApplyB2BCoupon = async () => {
    if (!b2bItem || !b2bCouponCode.trim()) return;
    try {
      setB2BCouponLoading(true);
      setB2BCouponMessage('');
      const { data } = await b2bCouponAPI.validateCoupon({ code: b2bCouponCode, orderAmount: checkoutSubtotal });
      setB2BCoupon(data.coupon);
      setB2BCouponDiscount(Number(data.discount || 0));
      setB2BCouponMessage('Coupon applied');
    } catch (err) {
      setB2BCoupon(null);
      setB2BCouponDiscount(0);
      setB2BCouponMessage(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setB2BCouponLoading(false);
    }
  };

  const handleApplyB2CCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponLoading(true);
      setCouponMessage('');
      const { data } = await couponAPI.validateCoupon({ code: couponCode, orderAmount: checkoutSubtotal });
      setAppliedCoupon(data.coupon);
      setCouponDiscount(Number(data.discount || 0));
      setCouponMessage('Coupon applied');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setRequiresPrescription(false);
      const address = addresses.find((a) => a._id === selectedAddress);
      if (!address) {
        setError('Please select a delivery address');
        setLoading(false);
        return;
      }
      if (!isCompleteAddress(address)) {
        setError('Please edit your selected address and ensure Zip Code is exactly 4 digits (e.g. 1000) before placing the order.');
        setLoading(false);
        return;
      }
      if (isSenior && !seniorDocUrl) {
        setError('Please upload your Senior Citizen Card/ID document to claim the 20% discount.');
        setLoading(false);
        return;
      }
      const orderData = b2bItem
        ? {
            shippingAddress: address,
            paymentMethod,
            isB2B: true,
            b2bItem: {
              productId: b2bItem.productId,
              name: b2bItem.name,
              image: b2bItem.image,
              tierLabel: b2bItem.tierLabel,
              quantity: b2bItem.quantity,
              price: b2bItem.price,
              couponCode: b2bCoupon?.code,
            },
            b2bCouponCode: b2bCoupon?.code,
          }
        : isBuyNow
          ? {
              shippingAddress: address,
              paymentMethod,
              isBuyNow: true,
              buyNowItem: {
                productId: buyNowItem.productId,
                quantity: buyNowItem.quantity,
              },
              couponCode: appliedCoupon?.code || undefined,
              isSeniorCitizen: isSenior,
              seniorCitizenIdDoc: seniorDocUrl || undefined,
            }
          : {
              shippingAddress: address,
              paymentMethod,
              couponCode: cart.coupon?.code || undefined,
              isSeniorCitizen: isSenior,
              seniorCitizenIdDoc: seniorDocUrl || undefined,
            };
      const { data: res } = await orderAPI.createOrder(orderData);
      if (b2bItem) {
        sessionStorage.removeItem('pendingB2BCheckout');
      } else if (isBuyNow) {
        sessionStorage.removeItem('pendingBuyNowCheckout');
      } else {
        await clearCart();
      }
      navigate(`/orders/${res.order._id}?success=true`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Order placement failed');
      setRequiresPrescription(Boolean(err.response?.data?.prescriptionItems?.length));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-custom py-4 lg:py-8">
      <button onClick={() => (b2bItem || isBuyNow ? navigate(-1) : navigate('/cart', { replace: true }))} className="pressable inline-flex items-center gap-2 text-gray-600 hover:text-brand mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {b2bItem || isBuyNow ? 'Back' : 'Back to Cart'}
      </button>

      <h1 className="mb-4 text-2xl font-bold text-gray-900 lg:mb-6">Checkout</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <p>{error}</p>
          {requiresPrescription && (
            <button
              type="button"
              onClick={() => navigate('/prescriptions')}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-100"
            >
              <FileText className="h-4 w-4" />
              Upload Prescription
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-5 lg:col-span-2 lg:space-y-6">
          {/* Senior Citizen Discount */}
          {!b2bItem && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white font-bold text-xs">S</span>
                <h2 className="text-lg font-bold text-gray-900">Senior Citizen Discount</h2>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSenior}
                    onChange={handleSeniorCheckboxChange}
                    className="rounded mt-1 text-brand focus:ring-brand"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Apply Senior Citizen 20% Discount</p>
                    <p className="text-xs text-gray-500 mt-0.5">You must upload a valid Senior Citizen ID card. We will verify it during order processing.</p>
                  </div>
                </label>

                {isSenior && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Upload Senior Citizen ID Card (JPG, PNG, PDF):</p>
                    
                    {seniorDocUrl ? (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                        <span className="text-xs text-green-700 truncate flex-1">Document Uploaded Successfully</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSeniorDocUrl('');
                          }}
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-gray-300 rounded-lg p-4 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleSeniorDocUpload}
                          disabled={uploadingSeniorDoc}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {uploadingSeniorDoc ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin text-brand" />
                            Uploading document...
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-brand font-medium">Click to select and upload document</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Supports JPG, PNG, PDF (max 10MB)</p>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-xs text-red-600 mt-2">{uploadError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
              </div>
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="pressable inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              )}
            </div>

            {/* Address Form (Add/Edit) */}
            {showAddressForm && (
              <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <button type="button" onClick={handleCloseForm} className="pressable p-1 hover:bg-gray-200 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {formError && (
                  <div className="mb-3 p-2.5 bg-red-50 text-red-600 text-sm rounded-lg">{formError}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                    <input
                      type="text" name="name" value={addressForm.name} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone *</label>
                    <input
                      type="tel" name="phone" value={addressForm.phone} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address *</label>
                    <input
                      type="text" name="addressLine1" value={addressForm.addressLine1} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Street address, house number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Barangay *</label>
                    <input
                      type="text" name="barangay" value={addressForm.barangay} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Barangay"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City / Municipality *</label>
                    <input
                      type="text" name="cityMunicipality" value={addressForm.cityMunicipality} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Province *</label>
                    <input
                      type="text" name="province" value={addressForm.province} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Province"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Zip Code *</label>
                    <input
                      type="text" name="zipCode" value={addressForm.zipCode} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Zip code"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox" id="isDefault" name="isDefault" checked={addressForm.isDefault} onChange={handleFormChange}
                      className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-600">Set as default address</label>
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                    <button
                      type="button" onClick={handleCloseForm}
                      className="pressable px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button" onClick={handleSaveAddress} disabled={formLoading}
                      className="pressable px-5 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {formLoading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Address List */}
            {addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-3">No saved addresses</p>
                <button
                  type="button" onClick={handleOpenAddForm}
                  className="pressable px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`border rounded-xl p-4 transition-colors relative ${
                      selectedAddress === addr._id ? 'border-brand bg-brand/5' : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <label className="cursor-pointer block">
                      <input
                        type="radio" name="address" value={addr._id}
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{addr.name}</p>
                          <p className="text-sm text-gray-500">{addr.phone}</p>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {addr.addressLine1}
                            {addr.barangay && `, ${addr.barangay}`}
                            <br />
                            {addr.cityMunicipality}, {addr.province} - {addr.zipCode}
                          </p>
                          {addr.isDefault && (
                            <span className="inline-block mt-2 text-xs font-medium text-brand bg-brand/10 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        {selectedAddress === addr._id && (
                          <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </label>
                    {/* Edit/Delete Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button" onClick={() => handleOpenEditForm(addr)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button" onClick={() => handleDeleteAddress(addr._id)}
                        disabled={deletingId === addr._id}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Payment Method */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
            </div>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-brand bg-brand/5' : 'border-gray-100'}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 text-brand" />
                <div>
                  <p className="font-medium text-gray-900">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay when you receive</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 lg:sticky lg:top-32">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {(b2bItem ? [b2bItem] : isBuyNow ? [buyNowItem] : cart.items || []).map((item) => {
                const quantity = Number(item.quantity || 0);
                const originalLineTotal = Number(item.price || 0) * quantity;
                const discountedLineTotal = (b2bItem ? Number(item.price || 0) : getSeniorPrice(item.price)) * quantity;
                return (
                  <div key={item.product?._id || item.productId || 'buynow-item'} className="flex justify-between gap-3 text-gray-600">
                    <span className="line-clamp-1">{b2bItem ? `${item.name} (${item.tierLabel})` : isBuyNow ? item.name : item.product?.name} x{item.quantity}</span>
                    <div className="text-right">
                      {seniorDiscountActive && originalLineTotal !== discountedLineTotal && (
                        <span className="block text-[10px] text-gray-400 line-through">₱{originalLineTotal.toFixed(0)}</span>
                      )}
                      <span>₱{discountedLineTotal.toFixed(0)}</span>
                      {seniorDiscountActive && !b2bItem && (
                        <span className="block text-[10px] font-semibold text-green-600">20% senior discount applied</span>
                      )}
                      <span className="text-[10px] text-gray-400 block">Inclusive of Tax</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {b2bItem && (
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                  <Tag className="h-4 w-4" />
                  Coupon
                </div>
                {b2bCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-blue-800">{b2bCoupon.code}</p>
                      <p className="text-xs text-blue-600">Discount: -PHP {b2bCouponDiscount.toFixed(0)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setB2BCoupon(null);
                        setB2BCouponDiscount(0);
                        setB2BCouponCode('');
                        setB2BCouponMessage('');
                      }}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={b2bCouponCode}
                      onChange={(e) => setB2BCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon"
                      className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={handleApplyB2BCoupon}
                      disabled={b2bCouponLoading || !b2bCouponCode.trim()}
                      className="pressable rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {b2bCouponLoading ? 'Applying' : 'Apply'}
                    </button>
                  </div>
                )}
                {b2bCouponMessage && (
                  <p className={`mt-2 text-xs font-semibold ${b2bCoupon ? 'text-green-700' : 'text-red-600'}`}>{b2bCouponMessage}</p>
                )}
              </div>
            )}
            {isBuyNow && (
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                  <Tag className="h-4 w-4" />
                  Coupon
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-blue-800">{appliedCoupon.code}</p>
                      <p className="text-xs text-blue-600">Discount: -₱{couponDiscount.toFixed(0)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponDiscount(0);
                        setCouponCode('');
                        setCouponMessage('');
                      }}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon"
                      className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={handleApplyB2CCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="pressable rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {couponLoading ? 'Applying' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponMessage && (
                  <p className={`mt-2 text-xs font-semibold ${appliedCoupon ? 'text-green-700' : 'text-red-600'}`}>{couponMessage}</p>
                )}
              </div>
            )}
            <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <div>
                  <span>Subtotal</span>
                  <span className="text-[10px] text-gray-400 block font-normal">Inclusive of Tax</span>
                </div>
                <span>₱{checkoutSubtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600 relative group">
                <span className="flex items-center gap-1.5 cursor-pointer">
                  Shipping
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold">i</span>
                  {/* Tooltip */}
                  <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-[11px] rounded-lg shadow-lg z-10 transition-opacity">
                    Shipping above ₱2000 is free
                  </span>
                </span>
                <span>{shipping === 0 ? 'Free' : `₱${shipping}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{b2bItem ? 'Coupon Discount' : 'Discount'}</span>
                  <span>-₱{discount.toFixed(0)}</span>
                </div>
              )}
              {seniorDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Senior Citizen Discount (20%)</span>
                  <span>-₱{seniorDiscount.toFixed(0)}</span>
                </div>
              )}
              {checkoutOfferDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Checkout Discount ({checkoutDiscount.discountPercentage}%)</span>
                  <span>-₱{checkoutOfferDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>₱{total.toFixed(0)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || addresses.length === 0}
              className="pressable w-full mt-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Placing Order...' : `Place Order • ₱${total.toFixed(0)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
