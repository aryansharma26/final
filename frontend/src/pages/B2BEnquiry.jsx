import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPageState, setPageState } from '../utils/pageCache.js';
import { ArrowLeft, Building2, CheckCircle, ChevronRight, Loader2, Mail, Package, Phone, Search, Send, ShoppingCart, X } from 'lucide-react';
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
          <p className="text-gray-600 mb-2 font-medium">Thank you for your interest in our B2B services.</p>
          <p className="text-gray-500 text-sm mb-8">Our team will review your enquiry and get back to you within 24 hours.</p>
          <button
            onClick={() => navigate('/')}
            className="pressable inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-10">
      <div className="container-custom">
        <button
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Title block without boilerplate */}
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                <Building2 className="w-3.5 h-3.5" /> B2B Portal
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight leading-none">
                Bulk Purchase & Wholesale Sourcing
              </h1>
              <p className="text-sm sm:text-base text-gray-500 max-w-xl">
                Browse our catalog, search products, and submit an enquiry for pricing and custom wholesale logistics.
              </p>
            </motion.div>
          </div>

          {/* Standalone High-visibility Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              {productsLoading && products.length === 0 ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by brand, generic name, or SKU..."
              className="w-full rounded-2xl border-2 border-brand/20 bg-white py-4 pl-12 pr-12 text-sm sm:text-base text-gray-900 placeholder-gray-400 font-medium transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 shadow-[0_8px_30px_rgba(24,83,164,0.04)]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute inset-y-0 right-2 my-1.5 flex items-center rounded-full px-3 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </motion.div>

          {/* Coupons section */}
          <B2BCoupons />

          {/* Catalog grid */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-8 shadow-[0_15px_50px_-15px_rgba(15,23,42,0.03)]"
          >
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-extrabold text-gray-950">Wholesale Products</h2>
              {debouncedSearch && !productsLoading && products.length > 0 && (
                <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                  Found {products.length} wholesale {products.length === 1 ? 'item' : 'items'} matching &quot;{debouncedSearch}&quot;
                </p>
              )}
            </div>

            {productsLoading && products.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
                    <div className="aspect-square bg-gray-50 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-50 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-bold mb-1">No products found</p>
                <p className="text-gray-500 text-sm mb-4">We couldn&apos;t find any wholesale items matching &quot;{debouncedSearch}&quot;.</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-brand hover:text-brand"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    onClick={() => openB2BProduct(product)}
                    whileHover={{ y: -6 }}
                    whileTap={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="pressable group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-shadow flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img
                        src={getB2BImage(product) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm border border-brand/5">
                        Wholesale
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="truncate text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{product.brand || 'Healthcare'}</p>
                          <Package className="h-3.5 w-3.5 shrink-0 text-brand/50" />
                        </div>
                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-gray-900 group-hover:text-brand transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-50 pt-3">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight">View Bulk Pricing</p>
                          <p className="hidden truncate text-[10px] text-gray-400 sm:block">Volume details inside</p>
                        </div>
                        <button className="pressable flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-brand-dark">
                          Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Enquiry form with sidebar */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_15px_50px_-15px_rgba(15,23,42,0.03)]"
          >
            <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
              {/* Sidebar */}
              <div className="relative border-b border-gray-100 bg-gradient-to-b from-brand/90 to-brand-dark/95 p-6 sm:p-8 lg:border-b-0 lg:border-r text-white flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative space-y-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white backdrop-blur">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Submit B2B Enquiry</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/85">
                      Tell us what products and quantities you need. Our team will prepare a custom wholesale quotation for you.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {[
                      { text: 'FDA-Compliant Sourcing', desc: 'Expiry and batch tracking guaranteed' },
                      { text: 'Wholesale Rates', desc: 'Tiered volume discount schedules' },
                      { text: 'Logistics coordination', desc: 'Secure direct supply delivery' }
                    ].map((item) => (
                      <div key={item.text} className="flex gap-3 items-start">
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{item.text}</p>
                          <p className="text-xs text-white/60 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8 lg:p-10">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Contact Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-gray-50/50 focus:bg-white"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Company / Business Name *</label>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      placeholder="Registered business name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-gray-50/50 focus:bg-white"
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.companyName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Business Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="corp@yourcompany.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-gray-50/50 focus:bg-white"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Contact Phone *</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-gray-50/50 focus:bg-white"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Business Type *</label>
                    <select
                      name="businessType"
                      value={form.businessType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-gray-50/50 focus:bg-white"
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.businessType && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.businessType}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Estimated Volume Required</label>
                    <input
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      placeholder="e.g., 500 units per month"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Requirements / Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="List down the products, quantities, delivery schedule, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all resize-none bg-gray-50/50 focus:bg-white"
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.message}</p>}
                </div>

                {errors.submit && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">{errors.submit}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="pressable w-full py-4 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-70 active:scale-98"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Sourcing Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.section>

          {/* Quick contact footer */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-[0_15px_50px_-15px_rgba(15,23,42,0.03)]">
            <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-widest">Or Contact Us Directly</p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:b2b@capsandpills.com"
                className="pressable inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50/50 hover:bg-brand/5 px-6 py-3 text-sm font-bold text-gray-700 hover:text-brand hover:border-brand/35 transition-all"
              >
                <Mail className="w-4 h-4 text-brand" /> b2b@capsandpills.com
              </a>
              <a
                href="tel:+639123456789"
                className="pressable inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50/50 hover:bg-brand/5 px-6 py-3 text-sm font-bold text-gray-700 hover:text-brand hover:border-brand/35 transition-all"
              >
                <Phone className="w-4 h-4 text-brand" /> +63 912 345 6789
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BEnquiry;