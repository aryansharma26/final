import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Tag, X, AlertTriangle, Truck, Shield, Clock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';

const Cart = () => {
  const { cart, itemCount, subtotal, updateQuantity, removeItem, applyCoupon, removeCoupon, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponInfo, setCouponInfo] = useState('');
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (couponInfo || couponError) {
      const timer = setTimeout(() => {
        setCouponInfo('');
        setCouponError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [couponInfo, couponError]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponError('');
      setCouponInfo('');
      await applyCoupon(couponCode);
      setCouponInfo('Coupon applied successfully!');
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.message || err.message || 'Invalid coupon');
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    if (!productId) return;
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      setCouponInfo('');
      setCouponError('');
      if (quantity <= 0) {
        setRemovingId(productId);
        setTimeout(async () => {
          const result = await removeItem(productId);
          if (result?.message && result.message.includes('Coupon removed')) {
            setCouponInfo(result.message);
          }
          setRemovingId(null);
        }, 300);
        return;
      }
      const result = await updateQuantity(productId, quantity);
      if (result?.message && result.message.includes('Coupon removed')) {
        setCouponInfo(result.message);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!productId) return;
    setRemovingId(productId);
    setTimeout(async () => {
      try {
        setCouponInfo('');
        setCouponError('');
        const result = await removeItem(productId);
        if (result?.message && result.message.includes('Coupon removed')) {
          setCouponInfo(result.message);
        }
      } catch (err) {
        console.error('Failed to remove item:', err);
      } finally {
        setRemovingId(null);
      }
    }, 300);
  };

  const { checkoutDiscount } = useSettings();
  const shipping = subtotal >= 2000 ? 0 : 50;
  const tax = Math.round(
    (cart.items || []).reduce((sum, item) => {
      const rate = item.product?.taxRate !== undefined ? item.product.taxRate : 12;
      return sum + (item.price * item.quantity) * (rate / (100 + rate));
    }, 0)
  );
  const discount = cart.couponDiscount || 0;

  let checkoutOfferDiscount = 0;
  if (checkoutDiscount?.enabled && subtotal >= checkoutDiscount.minOrderAmount) {
    checkoutOfferDiscount = Number((subtotal * (checkoutDiscount.discountPercentage / 100)).toFixed(2));
  }

  const total = subtotal + shipping - discount - checkoutOfferDiscount;
  const savings = discount + checkoutOfferDiscount + (shipping === 0 && subtotal > 0 ? 50 : 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        </div>

        <div className="min-h-[42vh] flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="max-w-sm text-gray-500 mb-7">Looks like you haven't added anything yet.</p>
          <Link to="/medicines" className="inline-flex items-center gap-2 px-7 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.items.map((item) => {
                const productId = item.product?._id;
                const isRemoving = removingId === productId;
                const isUpdating = updatingItems.has(productId);
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                const originalPrice = item.product?.price > 0 ? item.product.price : 0;
                const hasDiscount = item.product?.discountPrice > 0 && originalPrice > item.price;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - item.product.discountPrice) / originalPrice) * 100)
                  : 0;

                return (
                  <motion.div
                    key={productId || item._id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white border border-gray-100 rounded-2xl p-3.5 sm:p-5 transition-all shadow-sm hover:shadow-md ${isRemoving ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-5">
                      {/* Product Image */}
                      <Link
                        to={`/product/${item.product?.slug}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 hover:opacity-80 transition-opacity border border-gray-100"
                      >
                        <img
                          src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        {/* Top: Name + Delivery tag */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-1 mb-1">
                              <span className="inline-block px-2 py-0.5 bg-brand/10 text-brand text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-md">
                                {item.product?.brand}
                              </span>
                              {item.product?.isPrescriptionRequired && (
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-md">
                                  Prescription Required
                                </span>
                              )}
                            </div>
                            <Link to={`/product/${item.product?.slug}`} className="font-bold text-gray-900 text-sm sm:text-base hover:text-brand transition-colors line-clamp-2 block leading-snug">
                              {item.product?.name}
                            </Link>
                            <p className="text-xs text-gray-400 mt-1">{item.product?.dosageForm || 'Medicine'}</p>
                          </div>
                          <span className="w-fit text-[10px] sm:text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">Delivery in 2 days</span>
                        </div>

                        {/* Bottom: Price + Qty + Remove */}
                        <div className="mt-3 space-y-3 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                          {/* Price Block */}
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {hasDiscount && (
                              <span className="text-sm text-gray-400 line-through">₱{originalPrice.toFixed(0)}</span>
                            )}
                            <span className="text-lg font-bold text-gray-900">₱{(item.price || 0).toFixed(0)}</span>
                            {hasDiscount && (
                              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{discountPercent}% off</span>
                            )}
                            <span className="text-[10px] text-gray-400 block w-full font-normal">Inclusive of Tax</span>
                          </div>

                          {/* Actions: Qty + Remove */}
                          <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                                disabled={isUpdating || isRemoving}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 sm:w-10 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                                disabled={isUpdating || isRemoving}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price Block */}
                            <div className="text-right min-w-[4.75rem] sm:w-20">
                              <span className="text-sm font-bold text-gray-900 block">₱{itemTotal.toFixed(0)}</span>
                              <p className="text-[10px] text-gray-400">₱{(item.price || 0).toFixed(0)} each</p>
                              <span className="hidden sm:block text-[9px] text-gray-400 font-normal leading-tight">Inclusive of Tax</span>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(productId)}
                              disabled={isRemoving}
                              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

            {/* Coupon Section */}
            <div className="mb-5">
              {cart.coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-green-700">{cart.coupon.code || cart.coupon}</span>
                      <p className="text-xs text-green-600">Coupon applied</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
              {couponError && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {couponError}
                </p>
              )}
              {couponInfo && (
                <div className="flex items-center gap-1.5 mt-2 p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-700 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {couponInfo}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <div>
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="text-[10px] text-gray-400 block font-normal">Inclusive of Tax</span>
                </div>
                <span className="font-medium">₱{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600 relative group">
                <span className="flex items-center gap-1.5 cursor-pointer">
                  <Truck className="w-3.5 h-3.5" /> Shipping
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold">i</span>
                  {/* Tooltip */}
                  <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-[11px] rounded-lg shadow-lg z-10 transition-opacity">
                    Shipping above ₱2000 is free
                  </span>
                </span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'Free' : `₱${shipping}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> Discount
                  </span>
                  <span className="font-medium">-₱{discount.toFixed(0)}</span>
                </div>
              )}
              {checkoutOfferDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> Checkout Discount ({checkoutDiscount.discountPercentage}%)
                  </span>
                  <span className="font-medium">-₱{checkoutOfferDiscount.toFixed(2)}</span>
                </div>
              )}

              {savings > 0 && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-green-700 text-xs font-medium text-center">
                    You're saving ₱{savings.toFixed(0)} on this order!
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">₱{total.toFixed(0)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">Including taxes</p>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login?redirect=/checkout');
                  return;
                }
                navigate('/checkout');
              }}
              className="w-full mt-6 py-3.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="flex flex-col items-center gap-1 text-center p-2">
                <Truck className="w-5 h-5 text-brand" />
                <span className="text-[10px] text-gray-500 leading-tight">Free Delivery<br/>₱500+</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center p-2">
                <Shield className="w-5 h-5 text-brand" />
                <span className="text-[10px] text-gray-500 leading-tight">Genuine<br/>Products</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center p-2">
                <Clock className="w-5 h-5 text-brand" />
                <span className="text-[10px] text-gray-500 leading-tight">24/7<br/>Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
