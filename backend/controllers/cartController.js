import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Prescription from '../models/Prescription.js';

const hasAcceptedPrescriptionForProduct = async (userId, productId) => {
  const prescription = await Prescription.findOne({
    user: userId,
    requestedProduct: productId,
  }).sort({ uploadedAt: -1 });
  return ['pending', 'approved'].includes(prescription?.status);
};

const updateCartItemPrices = async (cart) => {
  for (let item of cart.items) {
    const product = await Product.findById(item.product);
    if (product) {
      let price = product.discountPrice > 0 ? product.discountPrice : product.price;
      if (product.bulkPricing && product.bulkPricing.length > 0) {
        const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
        const matchingTier = sortedTiers.find(tier => item.quantity >= tier.minQty && (!tier.maxQty || item.quantity <= tier.maxQty));
        if (matchingTier) {
          price = matchingTier.unitPrice;
        }
      }
      item.price = price;
    }
  }
};

/**
 * Recalculate coupon discount after cart mutation.
 * Returns { changed: boolean, message?: string, cart: Cart }
 */
const recalculateCoupon = async (cart) => {
  await updateCartItemPrices(cart);

  if (!cart.coupon) return { changed: false, cart };

  // Re-fetch the coupon to get latest rules
  const Coupon = (await import('../models/Coupon.js')).default;
  const coupon = await Coupon.findById(cart.coupon);

  if (!coupon || !coupon.isActive || coupon.endDate < new Date()) {
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    return { changed: true, message: 'Coupon has expired or is no longer active', cart };
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (subtotal < coupon.minOrderAmount) {
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    return { changed: true, message: `Minimum order amount is ₱${coupon.minOrderAmount}. Coupon removed.`, cart };
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

  cart.couponDiscount = discount;
  await cart.save();
  return { changed: true, cart };
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('coupon');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }
    // Check prescription requirement
    if (product.isPrescriptionRequired) {
      const hasPrescription = await hasAcceptedPrescriptionForProduct(req.user._id, product._id);
      if (!hasPrescription) {
        return res.status(403).json({
          success: false,
          message: 'This product requires a prescription upload before purchase. Please upload a valid prescription for this product.',
          requiresPrescription: true,
          productId: product._id,
        });
      }
    }
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    const currentQty = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
    const MAX_QTY_PER_ITEM = 10;
    const MAX_CART_ITEMS = 50;
    const totalQty = currentQty + Number(quantity);
    if (totalQty > MAX_QTY_PER_ITEM) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_QTY_PER_ITEM} per item allowed.` });
    }
    if (cart.items.length >= MAX_CART_ITEMS && itemIndex === -1) {
      return res.status(400).json({ success: false, message: `Cart can hold maximum ${MAX_CART_ITEMS} items.` });
    }
    if (product.stock < totalQty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} available. You already have ${currentQty} in cart.` });
    }
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = totalQty;
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity), price });
    }
    await updateCartItemPrices(cart);
    await cart.save();

    // Recalculate coupon after mutation
    const { changed, message } = await recalculateCoupon(cart);

    cart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('coupon');
    res.json({ success: true, message: changed ? message || 'Added to cart' : 'Added to cart', cart });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }
    await updateCartItemPrices(cart);
    await cart.save();

    // Recalculate coupon after mutation
    const { changed, message } = await recalculateCoupon(cart);

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('coupon');
    res.json({ success: true, message: changed ? message || 'Cart updated' : 'Cart updated', cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await updateCartItemPrices(cart);
    await cart.save();

    // Recalculate coupon after mutation
    const { changed, message } = await recalculateCoupon(cart);

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('coupon');
    res.json({ success: true, message: changed ? message || 'Item removed' : 'Item removed', cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], coupon: null, couponDiscount: 0 },
      { new: true }
    ).populate('items.product').populate('coupon');
    res.json({ success: true, message: 'Cart cleared', cart });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const Coupon = (await import('../models/Coupon.js')).default;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    if (coupon.endDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.startDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon not yet active' });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    // Per-user limit: check if this user has already used the coupon
    if (coupon.usedBy && coupon.usedBy.some((userId) => userId.equals(req.user._id))) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('coupon');
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    await updateCartItemPrices(cart);
    await cart.save();
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ₱${coupon.minOrderAmount}` });
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
    cart.coupon = coupon._id;
    cart.couponDiscount = discount;
    await cart.save();

    // Re-populate coupon before sending response
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('coupon');
    res.json({ success: true, message: 'Coupon applied', cart, discount });
  } catch (error) {
    next(error);
  }
};

export const removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { coupon: null, couponDiscount: 0 },
      { new: true }
    ).populate('items.product').populate('coupon');
    res.json({ success: true, message: 'Coupon removed', cart });
  } catch (error) {
    next(error);
  }
};
