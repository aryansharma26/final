import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle, CreditCard, Loader2, Mail, Package, Phone, Send, Tag, Truck, X } from 'lucide-react';
import { b2bProductAPI, contactAPI, b2bCouponAPI } from '../api/index.js';

const fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&h=700&fit=crop';
const getImageUrl = (image) => (typeof image === 'string' ? image : image?.url);

const B2BProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (location.state?.from) {
      navigate(-1);
    } else {
      navigate('/b2b-enquiry', { replace: true });
    }
  };
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    businessType: '',
    quantity: '',
    selectedTier: '',
    message: '',
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await b2bProductAPI.getProductBySlug(slug);
        setProduct(data.product);
      } catch (err) {
        console.error('Failed to load B2B product:', err);
        setError('B2B product not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [slug]);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const { data } = await b2bCouponAPI.getActiveCoupons();
        setActiveCoupons(data.coupons || []);
      } catch {
        setActiveCoupons([]);
      }
    };
    loadCoupons();
  }, []);

  const images = product?.images?.length ? product.images : [fallbackImage];
  const activeImage = getImageUrl(images[selectedImage]) || fallbackImage;
  const businessTypes = ['Pharmacy / Drugstore', 'Hospital / Clinic', 'Wholesaler / Distributor', 'Online Pharmacy', 'Corporate / Office', 'Other'];
  const inStock = Number(product?.stock || 0) > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const getTierLabel = (tier) => `${tier.label || 'Bulk Tier'} - PHP ${Number(tier.unitPrice || 0).toLocaleString()} / unit`;
const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

const getDisplaySku = (sku) => {
  const value = String(sku || '').trim();
  if (!value || /^(qwerty?|test|demo|sample|n\/?a|null|undefined)$/i.test(value)) {
    return 'On Request';
  }
  return value;
};

  const openEnquiryModal = (tier) => {
    setSelectedTier(tier || null);
    setSubmitted(false);
    setFormError('');
    if (tier) {
      setForm((prev) => ({ ...prev, selectedTier: getTierLabel(tier) }));
    }
    setShowEnquiryModal(true);
  };

  const closeEnquiryModal = () => {
    setShowEnquiryModal(false);
    setFormError('');
  };

  const handlePurchase = (tier) => {
    setPurchaseError('');
    if (!tier?.unitPrice) {
      setPurchaseError('Pricing is not configured for this option yet.');
      return;
    }

    const unitPrice = Number(tier.unitPrice || 0);
    const totalPrice = Number(tier.totalPrice || unitPrice);
    const quantity = unitPrice > 0 ? Math.max(1, Math.round(totalPrice / unitPrice)) : 1;

    const b2bItem = {
      productId: product._id,
      name: product.name,
      image: activeImage,
      tierLabel: tier.label || 'Bulk Tier',
      quantity,
      price: unitPrice,
      totalPrice: unitPrice * quantity,
    };

    sessionStorage.setItem('pendingB2BCheckout', JSON.stringify(b2bItem));
    navigate('/checkout', {
      state: {
        b2bItem,
      },
    });
  };

  const handleTierSelect = (tier) => {
    const label = `${tier.label || 'Bulk Tier'} - PHP ${Number(tier.unitPrice || 0).toLocaleString()} / unit`;
    setForm((prev) => ({ ...prev, selectedTier: label }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.companyName.trim() || !form.businessType) {
      setFormError('Please fill contact, company, phone, email, and business type.');
      return;
    }

    try {
      setSubmitting(true);
      await contactAPI.createContact({
        name: `${form.name} | ${form.companyName}`,
        email: form.email,
        phone: form.phone,
        subject: `B2B Product Enquiry - ${product.name}`,
        message: `[B2B PRODUCT ENQUIRY]\n\nProduct: ${product.name}\nBrand: ${product.brand}\nSKU: ${getDisplaySku(product.sku)}\nCompany: ${form.companyName}\nBusiness Type: ${form.businessType}\nSelected Tier: ${form.selectedTier || 'Not specified'}\nEstimated Quantity: ${form.quantity || 'Not specified'}\n\nMessage:\n${form.message || 'No extra message'}`,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-12 gap-6 animate-pulse">
          <div className="col-span-12 lg:col-span-5 aspect-square rounded-2xl bg-gray-200" />
          <div className="col-span-12 lg:col-span-7 space-y-3">
            <div className="h-7 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-36 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="container-custom py-16 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className="font-medium text-gray-500">{error || 'B2B product not found'}</p>
        <button onClick={handleGoBack} className="mt-4 inline-flex items-center gap-1 text-brand font-medium hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to B2B products
        </button>
      </div>
    );
  }

  return (
    <div className="container-custom py-4 lg:py-6">
      <button onClick={handleGoBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to B2B Products
      </button>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-50">
              <img src={activeImage} alt={product.name} className="h-full w-full object-contain p-3" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 ${selectedImage === index ? 'border-brand' : 'border-gray-200'}`}>
                    <img src={getImageUrl(image) || fallbackImage} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-7 lg:space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <Building2 className="h-3.5 w-3.5" /> B2B Product
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <h1 className="mt-3 text-xl font-bold leading-snug text-gray-950 sm:text-2xl lg:text-3xl">{product.name}</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">{product.brand}</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{product.description}</p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-xl bg-gray-50 p-2 sm:p-3">
                <p className="text-xs text-gray-500">Availability</p>
                <p className={`mt-1 truncate text-xs font-bold sm:text-sm ${inStock ? 'text-green-700' : 'text-red-600'}`}>{inStock ? 'In Stock' : 'Out of Stock'}</p>
              </div>
              <div className="min-w-0 rounded-xl bg-gray-50 p-2 sm:p-3">
                <p className="text-xs text-gray-500">Order Type</p>
                <p className="mt-1 truncate text-xs font-bold text-gray-900 sm:text-sm">Bulk Supply</p>
              </div>
              <div className="min-w-0 rounded-xl bg-gray-50 p-2 sm:p-3">
                <p className="text-xs text-gray-500">Delivery</p>
                <p className="mt-1 truncate text-xs font-bold text-gray-900 sm:text-sm">Priority</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50/50 p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                  <Tag className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-green-950 sm:text-lg">Bulk Pricing</h2>
                  <p className="text-xs text-green-700/80">Choose a tier or request custom quantity.</p>
                </div>
              </div>
            </div>
            {product.bulkPricing?.length > 0 ? (
              <div className="space-y-2.5">
                {product.bulkPricing.map((tier, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-green-100 bg-white p-3 shadow-sm sm:px-4 sm:py-3"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">{tier.label || 'Bulk Tier'}</p>
                          {tier.totalPrice ? (
                            <p className="mt-0.5 text-xs font-semibold text-gray-500">Total: {formatMoney(tier.totalPrice)}</p>
                          ) : null}
                        </div>
                        <p className="mt-1 text-green-700">
                          <span className="text-base font-bold sm:text-lg">{formatMoney(tier.unitPrice)}</span>
                          <span className="ml-1 text-[11px] text-gray-500">/unit</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePurchase(tier)}
                          disabled={!inStock}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Purchase Now
                        </button>
                        <button
                          type="button"
                          onClick={() => openEnquiryModal(tier)}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                        >
                          <Send className="h-3.5 w-3.5" /> Enquire Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-green-200 bg-white p-3 shadow-sm sm:px-4 sm:py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Custom Order</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                        Need a different quantity or business requirement?
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEnquiryModal(null)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                    >
                      <Send className="h-3.5 w-3.5" /> Enquire Custom
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-4 text-sm text-gray-600">
                <p>Bulk rates are available on request for this product.</p>
                <button
                  type="button"
                  onClick={() => openEnquiryModal(null)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  <Send className="h-3.5 w-3.5" /> Enquire Now
                </button>
              </div>
            )}
            {purchaseError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{purchaseError}</p>}
          </div>

          {activeCoupons.length > 0 && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-700" />
                <h2 className="text-base font-bold text-blue-950">Coupons</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeCoupons.map((coupon) => (
                  <div key={coupon._id} className="rounded-xl border border-blue-100 bg-white p-3">
                    <p className="font-mono text-sm font-bold text-blue-800">{coupon.code}</p>
                    <p className="mt-1 text-xs text-blue-700">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `PHP ${coupon.discountValue} off`}
                      {coupon.maxDiscountAmount ? `, max PHP ${coupon.maxDiscountAmount}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">Min order: PHP {Number(coupon.minOrderAmount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {[
            { icon: Package, title: 'Wholesale Supply', text: 'Bulk options for pharmacies, clinics, hospitals, and distributors.' },
            { icon: Truck, title: 'Priority Delivery', text: 'Delivery planning is discussed after enquiry confirmation.' },
            { icon: Phone, title: 'Dedicated Support', text: 'A business support person follows up on every product enquiry.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <item.icon className="mb-3 h-5 w-5 text-brand" />
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
          <p className="font-semibold text-gray-900">Direct contact</p>
          <a href="mailto:b2b@capsandpills.com" className="mt-3 flex items-center gap-2 text-brand"><Mail className="h-4 w-4" /> b2b@capsandpills.com</a>
          <a href="tel:+639123456789" className="mt-2 flex items-center gap-2 text-brand"><Phone className="h-4 w-4" /> +63 912 345 6789</a>
        </div>
      </div>

      {showEnquiryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/40" onClick={closeEnquiryModal} aria-label="Close enquiry modal" />
          <form onSubmit={handleSubmit} className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Send Product Enquiry</h2>
                <p className="mt-1 text-sm text-gray-500">{product.name}</p>
              </div>
              <button type="button" onClick={closeEnquiryModal} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Contact name *" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Company / business name *" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email *" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone *" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <select name="businessType" value={form.businessType} onChange={handleChange} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="">Business type *</option>
                {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="Estimated quantity" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <input name="selectedTier" value={form.selectedTier} onChange={handleChange} placeholder="Selected pricing tier" className="sm:col-span-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <textarea name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Extra requirement, delivery schedule, location, etc." className="sm:col-span-2 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            {formError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            {submitted && <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">Enquiry submitted. Our team will contact you within 24 hours.</p>}
            <button type="submit" disabled={submitting || submitted} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark disabled:opacity-70">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitted ? <CheckCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {submitted ? 'Submitted' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default B2BProductDetail;
