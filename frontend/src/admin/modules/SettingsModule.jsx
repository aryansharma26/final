import { useState, useEffect } from 'react';
import { Save, AlertCircle, Percent, Megaphone, Zap, Search, Plus, Trash2, Loader2, Package } from 'lucide-react';
import { settingAPI, productAPI } from '../../api/index.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import B2BCouponsModule from './B2BCouponsModule.jsx';
import CouponsModule from './CouponsModule.jsx';

const SettingsModule = () => {
  const { banner, checkoutDiscount, flashDeal, fetchSettings } = useSettings();
  const [formData, setFormData] = useState({
    banner: {
      show: false,
      text: '',
      link: '',
    },
    checkoutDiscount: {
      enabled: false,
      minOrderAmount: 1000,
      discountPercentage: 10,
    },
    flashDeal: {
      show: false,
      endDate: '2026-08-31 23:59:59',
      headline: 'Flash Deals',
      subtext: 'Up to 50% off on essential medicines',
      buttonText: 'Shop Now',
      buttonLink: '/offers',
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Offer Products list states
  const [offerProducts, setOfferProducts] = useState([]);
  const [offerProductsLoading, setOfferProductsLoading] = useState(false);

  // Search products states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (banner || checkoutDiscount || flashDeal) {
      setFormData({
        banner: {
          show: banner?.show || false,
          text: banner?.text || '',
          link: banner?.link || '',
        },
        checkoutDiscount: {
          enabled: checkoutDiscount?.enabled || false,
          minOrderAmount: checkoutDiscount?.minOrderAmount || 1000,
          discountPercentage: checkoutDiscount?.discountPercentage || 10,
        },
        flashDeal: {
          show: flashDeal?.show || false,
          endDate: flashDeal?.endDate || '2026-08-31 23:59:59',
          headline: flashDeal?.headline || 'Flash Deals',
          subtext: flashDeal?.subtext || 'Up to 50% off on essential medicines',
          buttonText: flashDeal?.buttonText || 'Shop Now',
          buttonLink: flashDeal?.buttonLink || '/offers',
        }
      });
    }
    loadOfferProducts();
  }, [banner, checkoutDiscount, flashDeal]);

  const loadOfferProducts = async () => {
    try {
      setOfferProductsLoading(true);
      const { data } = await productAPI.getProducts({ discount: true, limit: 100 });
      setOfferProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load offer products:', err);
    } finally {
      setOfferProductsLoading(false);
    }
  };

  const handleSearchProducts = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      const { data } = await productAPI.getProducts({ search: searchQuery, limit: 10 });
      setSearchResults(data.products || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddToOffers = async (productId) => {
    try {
      const { data } = await productAPI.updateOfferStatus(productId, true);
      if (data.success) {
        setMessage('Product added to offers list!');
        loadOfferProducts();
        setSearchResults(prev => prev.filter(p => p._id !== productId));
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to add to offers');
      setTimeout(() => { setMessage(''); setIsError(false); }, 3000);
    }
  };

  const handleRemoveFromOffers = async (productId) => {
    try {
      const { data } = await productAPI.updateOfferStatus(productId, false);
      if (data.success) {
        setMessage('Product removed from offers list.');
        loadOfferProducts();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to remove from offers');
      setTimeout(() => { setMessage(''); setIsError(false); }, 3000);
    }
  };

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      setIsError(false);
      
      const { data } = await settingAPI.updatePromoBanner(formData);
      if (data.success) {
        setMessage('Offers and promotion settings updated successfully!');
        await fetchSettings();
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Percent className="w-6 h-6 text-brand" /> Offer Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure global store discounts, coupons, promo banners, and flash deals.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {isError && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitSettings} className="space-y-6">
            
            {/* ─── BANNER SECTION ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <Megaphone className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-800">Announcement / Offer Banner</h2>
              </div>

              <div className="space-y-4">
                {/* Toggle Banner */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                  <div>
                    <label className="font-medium text-gray-900 block text-sm">Display Offer Banner</label>
                    <span className="text-xs text-gray-500">Show or hide the marketing banner at the top of the entire website.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      banner: { ...formData.banner, show: !formData.banner.show }
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.banner.show ? 'bg-brand' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.banner.show ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Banner Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Text Content</label>
                  <input
                    type="text"
                    value={formData.banner.text}
                    onChange={(e) => setFormData({
                      ...formData,
                      banner: { ...formData.banner, text: e.target.value }
                    })}
                    required={formData.banner.show}
                    placeholder="e.g. Special Offer: Buy 5+ medicines to get 20% off!"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>

                {/* Banner Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Redirection Link</label>
                  <input
                    type="text"
                    value={formData.banner.link}
                    onChange={(e) => setFormData({
                      ...formData,
                      banner: { ...formData.banner, link: e.target.value }
                    })}
                    placeholder="e.g. /offers or https://example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">Leave empty to display text without click redirection.</span>
                </div>

                {/* Banner Preview */}
                {formData.banner.show && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Preview</label>
                    <div className="w-full text-center py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl bg-pills-pink text-white select-none">
                      {formData.banner.text || 'Offer Banner Preview Text'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── FLASH DEAL SECTION ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <Zap className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-800">Flash Deals Section</h2>
              </div>

              <div className="space-y-4">
                {/* Toggle Flash Deal */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                  <div>
                    <label className="font-medium text-gray-900 block text-sm">Display Flash Deals Section</label>
                    <span className="text-xs text-gray-500">Show or hide the Flash Deals countdown section on the Home Page.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      flashDeal: { ...formData.flashDeal, show: !formData.flashDeal.show }
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.flashDeal.show ? 'bg-brand' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.flashDeal.show ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Headline and Subtext */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                    <input
                      type="text"
                      value={formData.flashDeal.headline}
                      onChange={(e) => setFormData({
                        ...formData,
                        flashDeal: { ...formData.flashDeal, headline: e.target.value }
                      })}
                      required={formData.flashDeal.show}
                      placeholder="e.g. Flash Deals"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtext</label>
                    <input
                      type="text"
                      value={formData.flashDeal.subtext}
                      onChange={(e) => setFormData({
                        ...formData,
                        flashDeal: { ...formData.flashDeal, subtext: e.target.value }
                      })}
                      required={formData.flashDeal.show}
                      placeholder="e.g. Up to 50% off on essential medicines"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>

                {/* End Date and Button Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                    <input
                      type="text"
                      value={formData.flashDeal.endDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        flashDeal: { ...formData.flashDeal, endDate: e.target.value }
                      })}
                      required={formData.flashDeal.show}
                      placeholder="YYYY-MM-DD HH:MM:SS"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">e.g. 2026-08-31 23:59:59</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.flashDeal.buttonText}
                      onChange={(e) => setFormData({
                        ...formData,
                        flashDeal: { ...formData.flashDeal, buttonText: e.target.value }
                      })}
                      placeholder="e.g. Shop Now"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Redirect Link</label>
                    <input
                      type="text"
                      value={formData.flashDeal.buttonLink}
                      onChange={(e) => setFormData({
                        ...formData,
                        flashDeal: { ...formData.flashDeal, buttonLink: e.target.value }
                      })}
                      placeholder="e.g. /offers"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── CHECKOUT DISCOUNT SECTION ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <Percent className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-800">Checkout Discount (Total Order Amount Offer)</h2>
              </div>

              <div className="space-y-4">
                {/* Toggle Discount */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                  <div>
                    <label className="font-medium text-gray-900 block text-sm">Enable Order Total Discount</label>
                    <span className="text-xs text-gray-500">Apply a percentage discount during checkout based on the user's order total.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      checkoutDiscount: { ...formData.checkoutDiscount, enabled: !formData.checkoutDiscount.enabled }
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.checkoutDiscount.enabled ? 'bg-brand' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.checkoutDiscount.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₱)</label>
                    <input
                      type="number"
                      value={formData.checkoutDiscount.minOrderAmount}
                      onChange={(e) => setFormData({
                        ...formData,
                        checkoutDiscount: { ...formData.checkoutDiscount, minOrderAmount: Number(e.target.value) }
                      })}
                      required={formData.checkoutDiscount.enabled}
                      min="1"
                      placeholder="e.g. 1000"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                    <input
                      type="number"
                      value={formData.checkoutDiscount.discountPercentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        checkoutDiscount: { ...formData.checkoutDiscount, discountPercentage: Number(e.target.value) }
                      })}
                      required={formData.checkoutDiscount.enabled}
                      min="1"
                      max="100"
                      placeholder="e.g. 10"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>

                {formData.checkoutDiscount.enabled && (
                  <p className="text-xs text-brand font-medium mt-1">
                    ℹ️ Users will get a {formData.checkoutDiscount.discountPercentage}% discount on checkout if their item total is ₱{formData.checkoutDiscount.minOrderAmount} or above.
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand/90 disabled:bg-brand/50 text-white rounded-xl font-semibold transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Offer Products Manager */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <CouponsModule embedded={true} />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <B2BCouponsModule />
          </div>
          
          {/* SEARCH & ADD CARD */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <Plus className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-800 text-sm">Add Product to Offers Page</h2>
            </div>

            <form onSubmit={handleSearchProducts} className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Search results list */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[220px] overflow-y-auto border border-gray-50 p-2 rounded-xl bg-gray-50/50">
                {searchResults.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-gray-400">₱{product.price} • {product.brand}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToOffers(product._id)}
                      className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Add to Offers"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && !searchLoading && (
              <p className="text-[10px] text-gray-400 text-center py-2">No matching products found.</p>
            )}
          </div>

          {/* ACTIVE OFFER ITEMS LIST CARD */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-800 text-sm">Active Offer Items</h2>
              </div>
              <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-full">
                {offerProducts.length}
              </span>
            </div>

            {offerProductsLoading ? (
              <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-xs gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading items...
              </div>
            ) : offerProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-gray-400">
                <Package className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs">No active offer items.</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Use the search box above to add products.</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 max-h-[460px] overflow-y-auto pr-1">
                {offerProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:border-brand/10 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-gray-500">
                        ₱{product.discountPrice > 0 ? (
                          <>
                            <span className="text-green-600 font-medium">₱{product.discountPrice}</span>
                            <span className="line-through text-gray-400 ml-1">₱{product.price}</span>
                          </>
                        ) : `₱${product.price}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromOffers(product._id)}
                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove from Offers"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default SettingsModule;
