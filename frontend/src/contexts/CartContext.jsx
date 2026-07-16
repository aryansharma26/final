import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      return { success: false, message: 'Invalid product' };
    }

    if (!isAuthenticated) {
      if (productData?.isPrescriptionRequired) {
        return {
          success: false,
          message: 'Please log in and upload a prescription before adding this product to cart.',
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
      return { success: true, message };
    }
    try {
      const { data } = await cartAPI.addToCart({ productId, quantity });
      setCart(data.cart);
      return { success: true, message: data.message };
    } catch (err) {
      console.error('Add to cart failed:', err?.response?.data?.message || err.message);
      return { success: false, message: err?.response?.data?.message || 'Failed to add to cart', requiresPrescription: err?.response?.data?.requiresPrescription };
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
    const { data } = await cartAPI.updateItem({ productId, quantity });
    setCart(data.cart);
    return { success: true, message: data.message };
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
