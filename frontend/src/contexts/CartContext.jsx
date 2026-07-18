import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X, XCircle } from 'lucide-react';
import { cartAPI } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const getProductId = (item) => item.product?._id || item.product;

const GUEST_CART_KEY = 'guestCart';

const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '{"items":[],"coupon":null,"couponDiscount":0,"couponDetails":null}');
  } catch {
    return { items: [], coupon: null, couponDiscount: 0, couponDetails: null };
  }
};
const setGuestCart = (cart) => localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));

const cleanCartErrorMessage = (msg) => {
  if (!msg) return '';
  return msg.replace(/\.?\s*you\s+already\s+have\s+.*?\s+in\s+cart\.?/gi, '').trim();
};

const updateGuestCartPrices = (items) => {
  return items.map((item) => {
    const p = item.product;
    if (!p) return item;
    let price = p.discountPrice > 0 ? p.discountPrice : p.price || 0;
    if (p.bulkPricing && p.bulkPricing.length > 0) {
      const sortedTiers = [...p.bulkPricing].sort((a, b) => b.minQty - a.minQty);
      const matchingTier = sortedTiers.find(tier => item.quantity >= tier.minQty && (!tier.maxQty || item.quantity <= tier.maxQty));
      if (matchingTier) {
        price = matchingTier.unitPrice;
      }
    }
    return { ...item, price };
  });
};

const recalculateGuestCoupon = (cart) => {
  const updatedItems = updateGuestCartPrices(cart.items || []);
  const subtotal = updatedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0) || 0;

  if (!cart.coupon || !cart.couponDetails) {
    return { cart: { ...cart, items: updatedItems }, changed: false };
  }

  const coupon = cart.couponDetails;

  if (subtotal < (coupon.minOrderAmount || 0)) {
    const newCart = { ...cart, items: updatedItems, coupon: null, couponDiscount: 0, couponDetails: null };
    return { cart: newCart, changed: true, message: `Minimum order amount is ₱${coupon.minOrderAmount}. Coupon removed.` };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }

  const newCart = { ...cart, items: updatedItems, couponDiscount: discount };
  return { cart: newCart, changed: true };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], coupon: null, couponDiscount: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      const localCart = getGuestCart();
      const { cart: recalcCart } = recalculateGuestCoupon(localCart);
      setGuestCart(recalcCart);
      setCart(recalcCart);
      return;
    }
    try {
      setLoading(true);
      const { data: cartData } = await cartAPI.getCart();
      setCart(cartData.cart || { items: [], coupon: null, couponDiscount: 0 });
    } catch (err) {
      console.error('Failed to load cart:', err);
      setCart({ items: [], coupon: null, couponDiscount: 0 });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = async (productOrId, quantity = 1) => {
    const productId = typeof productOrId === 'string' ? productOrId : productOrId?._id;
    const productData = typeof productOrId === 'string' ? null : productOrId;

    if (!productId) {
      console.error('addToCart: productId is undefined');
      showToast('Failed to add: Invalid product', 'error');
      return { success: false, message: 'Invalid product' };
    }

    if (!isAuthenticated) {
      if (productData?.isPrescriptionRequired) {
        const errMsg = 'Please log in and upload a prescription before adding this product.';
        showToast(errMsg, 'error');
        return {
          success: false,
          message: errMsg,
          requiresPrescription: true,
        };
      }
      const localCart = getGuestCart();
      const existingIndex = localCart.items.findIndex((i) => getProductId(i) === productId);
      let newCart;
      if (existingIndex !== -1) {
        const newItems = [...localCart.items];
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + quantity };
        newCart = { ...localCart, items: newItems };
      } else {
        const productToStore = productData
          ? {
              _id: productData._id,
              name: productData.name,
              brand: productData.brand,
              images: productData.images,
              slug: productData.slug,
              price: productData.price,
              discountPrice: productData.discountPrice,
              isPrescriptionRequired: productData.isPrescriptionRequired,
              taxRate: productData.taxRate,
              bulkPricing: productData.bulkPricing,
            }
          : { _id: productId };
        const price = productData?.discountPrice > 0 ? productData.discountPrice : productData?.price || 0;
        newCart = { ...localCart, items: [...localCart.items, { product: productToStore, quantity, price }] };
      }
      const { cart: recalcCart, changed, message } = recalculateGuestCoupon(newCart);
      setGuestCart(recalcCart);
      setCart(recalcCart);
      showToast('Added to cart successfully!', 'success');
      return { success: true, message };
    }
    try {
      const { data } = await cartAPI.addToCart({ productId, quantity });
      setCart(data.cart);
      showToast(data.message || 'Added to cart successfully!', 'success');
      return { success: true, message: data.message };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to add to cart';
      const cleanMsg = cleanCartErrorMessage(errMsg);
      console.error('Add to cart failed:', errMsg);
      showToast(cleanMsg, 'error');
      return { success: false, message: cleanMsg, requiresPrescription: err?.response?.data?.requiresPrescription };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) {
      const localCart = getGuestCart();
      let newCart;
      if (quantity <= 0) {
        newCart = { ...localCart, items: localCart.items.filter((i) => getProductId(i) !== productId) };
      } else {
        const newItems = [...localCart.items];
        const itemIndex = newItems.findIndex((i) => getProductId(i) === productId);
        if (itemIndex !== -1) {
          newItems[itemIndex] = { ...newItems[itemIndex], quantity };
        }
        newCart = { ...localCart, items: newItems };
      }
      const { cart: recalcCart, changed, message } = recalculateGuestCoupon(newCart);
      setGuestCart(recalcCart);
      setCart(recalcCart);
      return { success: true, message };
    }
    try {
      const { data } = await cartAPI.updateItem({ productId, quantity });
      setCart(data.cart);
      return { success: true, message: data.message };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to update quantity';
      const cleanMsg = cleanCartErrorMessage(errMsg);
      console.error('Update quantity failed:', errMsg);
      showToast(cleanMsg, 'error');
      return { success: false, message: cleanMsg };
    }
  };

  const removeItem = async (productId) => {
    if (!isAuthenticated) {
      const localCart = getGuestCart();
      const newCart = { ...localCart, items: localCart.items.filter((i) => getProductId(i) !== productId) };
      const { cart: recalcCart, changed, message } = recalculateGuestCoupon(newCart);
      setGuestCart(recalcCart);
      setCart(recalcCart);
      return { success: true, message };
    }
    const { data } = await cartAPI.removeItem(productId);
    setCart(data.cart);
    return { success: true, message: data.message };
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      localStorage.removeItem(GUEST_CART_KEY);
      setCart({ items: [], coupon: null, couponDiscount: 0 });
      return { success: true };
    }
    const { data } = await cartAPI.clearCart();
    setCart(data.cart);
    return data;
  };

  const applyCoupon = async (code) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to apply coupons and checkout.');
    }

    const { data } = await cartAPI.applyCoupon({ code });
    setCart(data.cart);
    return data;
  };

  const removeCoupon = async () => {
    if (!isAuthenticated) {
      const localCart = getGuestCart();
      const newCart = { ...localCart, coupon: null, couponDetails: null, couponDiscount: 0 };
      setGuestCart(newCart);
      setCart(newCart);
      return { success: true, cart: newCart };
    }

    const { data } = await cartAPI.removeCoupon();
    setCart(data.cart);
    return data;
  };

  const itemCount = cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const subtotal = cart.items?.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart: loadCart,
        showToast,
      }}
    >
      {children}

      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-24 right-5 z-[9999] max-w-sm w-full px-4 sm:px-0">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
                toast.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-100'
                  : 'bg-green-50 text-green-800 border-green-100'
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {toast.type === 'error' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : toast.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-5">{toast.message}</p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setToast(null)}
                className="shrink-0 ml-1 rounded-lg p-0.5 text-gray-400 hover:bg-black/5 hover:text-gray-700 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};
