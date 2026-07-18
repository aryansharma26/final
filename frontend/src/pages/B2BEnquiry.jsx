import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPageState, setPageState } from '../utils/pageCache.js';
import { ArrowLeft, BadgeCheck, Building2, Send, CheckCircle, Handshake, Loader2, Package, Percent, Phone, Mail, ShoppingCart, ChevronRight, Search, Warehouse, X } from 'lucide-react';
import { contactAPI, b2bProductAPI } from '../api/index.js';
import B2BCoupons from '../sections/B2BCoupons.jsx';

const getB2BImage = (product) => {
  const image = product?.images?.[0];
  return typeof image === 'string' ? image : image?.url;
};

const B2BEnquiry = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cacheKey = location.pathname + location.search;
  const cachedStateRef = useRef(getPageState(cacheKey));
  const cachedState = cachedStateRef.current;
  const tapTimeoutRef = useRef(null);

  const [products, setProducts] = useState(() => cachedState?.products || []);
  const [productsLoading, setProductsLoading] = useState(() => (cachedState ? false : true));
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isFirstRender = useRef(true);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    businessType: '',
    productInterest: '',
    quantity: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (cachedState) {
        return;
      }
    }
    loadProducts(debouncedSearch);
  }, [debouncedSearch]);

  // Keep page cache in sync
  useEffect(() => {
    if (!productsLoading) {
      setPageState(cacheKey, { products });
    }
  }, [products, cacheKey, productsLoading]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const openB2BProduct = (product) => {
    const target = `/b2b-product/${product.slug}`;
    const options = {
      state: { from: { pathname: location.pathname, search: location.search } },
    };

    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => navigate(target, options), 120);
      return;
    }

    navigate(target, options);
  };

  const loadProducts = async (searchQuery = '') => {
    try {
      setProductsLoading(true);
      const params = { limit: 50, status: 'active' };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const { data } = await b2bProductAPI.getProducts(params);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load B2B products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const businessTypes = [
    'Pharmacy / Drugstore',
    'Hospital / Clinic',
    'Wholesaler / Distributor',
    'Online Pharmacy',
    'Corporate / Office',
    'Other',
  ];

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Contact name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Valid email is required';
    }
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.companyName.trim()) errs.companyName = 'Company / Business name is required';
    if (!form.businessType) errs.businessType = 'Business type is required';
    if (!form.message.trim()) errs.message = 'Please describe your requirements';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await contactAPI.createContact({
        name: `${form.name} | ${form.companyName}`,
        email: form.email,
        phone: form.phone,
        subject: `B2B Enquiry - ${form.businessType} | Qty: ${form.quantity || 'Not specified'}`,
        message: `[B2B ENQUIRY]\n\nCompany: ${form.companyName}\nBusiness Type: ${form.businessType}\nEstimated Quantity: ${form.quantity || 'Not specified'}\n\nMessage:\n${form.message}`,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Enquiry Submitted!</h1>
          <p className="text-gray-600 mb-2">Thank you for your interest in our B2B services.</p>
          <p className="text-gray-500 text-sm mb-8">Our team will review your enquiry and get back to you within 24 hours.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-5 sm:py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-brand/10 bg-gradient-to-br from-brand-light via-white to-white shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand shadow-sm sm:mb-4">
              <Building2 className="w-3.5 h-3.5" />
              Bulk Orders & Business Partnerships
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-extrabold leading-tight text-gray-950 sm:text-3xl">
                  Wholesale medicines and healthcare stock for your business.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-gray-600 sm:text-base sm:leading-6">
                  Browse the bulk catalog, shortlist products, and submit one clear enquiry for pricing, stock availability, and delivery coordination.
                </p>
              </div>
              
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              {[
                { icon: Warehouse, title: 'Bulk stock' },
                { icon: Percent, title: 'Business rates' },
                { icon: Handshake, title: 'Direct support' },
              ].map(({ icon: Icon, title }) => (
                <div key={title} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-brand" />
                  {title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <B2BCoupons />

        {/* Products Grid */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:mb-10 sm:p-5">
          <div className="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">Wholesale Catalog</p>
                <h2 className="text-xl font-bold text-gray-950">Wholesale Products</h2>
              </div>
              <p className="text-sm text-gray-500">Tap a product for rates and enquiry options.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {productsLoading && products.length === 0 ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search wholesale products by name, brand, SKU, or tags..."
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-gray-50 sm:py-3.5"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {productsLoading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-3 animate-pulse sm:p-4">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-gray-100 bg-white sm:py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              {debouncedSearch ? (
                <>
                  <p className="text-gray-900 font-semibold mb-1">No products found</p>
                  <p className="text-gray-500 text-sm mb-4">We couldn&apos;t find any wholesale products matching &quot;{debouncedSearch}&quot;.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/30 text-xs font-semibold rounded-xl transition-colors bg-white shadow-sm"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p className="text-gray-500">No wholesale products available yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  onClick={() => openB2BProduct(product)}
                  whileHover={{ y: -6 }}
                  whileTap={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-lg active:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={getB2BImage(product) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-105"
                    />
                  </div>
                  <div className="p-2.5 sm:p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-bold uppercase tracking-wide text-gray-400">{product.brand || 'Healthcare'}</p>
                      <Package className="h-4 w-4 shrink-0 text-brand/60" />
                    </div>
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-gray-950 transition-colors group-hover:text-brand group-active:text-brand">
                      {product.name}
                    </h3>

                    <p className="mt-2 hidden min-h-[2.5rem] text-xs leading-5 text-gray-500 line-clamp-2 sm:block">
                      {product.description || 'View product details, wholesale options, and availability.'}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-2 sm:mt-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-900 sm:text-xs">View rates & stock</p>
                        <p className="hidden truncate text-[10px] text-gray-400 sm:block">Business pricing on detail page</p>
                      </div>
                      <button className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-bold text-brand shadow-sm transition-colors group-hover:bg-brand group-hover:text-white sm:px-3">
                        <ShoppingCart className="hidden h-3 w-3 sm:block" /> Details <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Enquiry Form */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="bg-brand p-4 text-white sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Custom Request</p>
              <h2 className="mt-2 text-2xl font-bold">Submit B2B Enquiry</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">Share business details, quantity, and delivery needs. Our team will reply with next steps.</p>
              <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-3">
                {['Company profile', 'Product requirements', 'Quantity and delivery plan'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company / Business Name *</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Business name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="business@company.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type *</label>
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white"
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Quantity</label>
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="e.g., 500 units per month"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirements / Message *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about your requirements, preferred products, delivery schedule, etc."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{errors.submit}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Enquiry
                </>
              )}
            </button>
          </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-3">Prefer to reach out directly?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:b2b@capsandpills.com" className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-dark font-medium">
              <Mail className="w-4 h-4" /> b2b@capsandpills.com
            </a>
            <a href="tel:+639123456789" className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-dark font-medium">
              <Phone className="w-4 h-4" /> +63 912 345 6789
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BEnquiry;
