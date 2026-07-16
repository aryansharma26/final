import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';

const normalizeCouponPayload = (payload) => {
  const next = { ...payload };
  if (next.code !== undefined) next.code = String(next.code).trim().toUpperCase();
  if (next.description !== undefined) next.description = String(next.description || '').trim();
  ['discountValue', 'minOrderAmount', 'maxDiscountAmount'].forEach((field) => {
    if (next[field] === '' || next[field] === null) {
      next[field] = field === 'maxDiscountAmount' ? null : 0;
    } else if (next[field] !== undefined) {
      next[field] = Number(next[field]);
    }
  });
  if (next.usageLimit === '' || next.usageLimit === null) {
    next.usageLimit = null;
  } else if (next.usageLimit !== undefined) {
    next.usageLimit = Number(next.usageLimit);
  }
  return next;
};

const validateCouponRules = (couponData) => {
  if (couponData.discountType === 'percentage' && Number(couponData.discountValue) > 100) {
    return 'Percentage discount cannot exceed 100%';
  }
  if (couponData.startDate && couponData.endDate && new Date(couponData.endDate) <= new Date(couponData.startDate)) {
    return 'End date must be after start date';
  }
  if (couponData.maxDiscountAmount !== null && couponData.maxDiscountAmount !== undefined && Number(couponData.maxDiscountAmount) < 0) {
    return 'Maximum discount amount must be zero or greater';
  }
  return null;
};

const getCartSubtotal = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) return 0;
  return cart.items.reduce((sum, item) => {
    const product = item.product;
    if (!product) return sum;
    let price = product.discountPrice > 0 ? product.discountPrice : product.price || 0;
    if (product.bulkPricing && product.bulkPricing.length > 0) {
      const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
      const matchingTier = sortedTiers.find((tier) => item.quantity >= tier.minQty && (!tier.maxQty || item.quantity <= tier.maxQty));
      if (matchingTier) price = matchingTier.unitPrice;
    }
    return sum + price * item.quantity;
  }, 0);
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

export const getActiveCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

export const getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const payload = normalizeCouponPayload(req.body);
    const ruleError = validateCouponRules(payload);
    if (ruleError) {
      return res.status(400).json({ success: false, message: ruleError });
    }
    const coupon = await Coupon.create(payload);
    res.status(201).json({ success: true, message: 'Coupon created', coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const existingCoupon = await Coupon.findById(req.params.id);
    if (!existingCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    const payload = normalizeCouponPayload(req.body);
    const ruleError = validateCouponRules({ ...existingCoupon.toObject(), ...payload });
    if (ruleError) {
      return res.status(400).json({ success: false, message: ruleError });
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json({ success: true, message: 'Coupon updated', coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const now = new Date();
    const coupon = await Coupon.findOne({ code: String(code || '').trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is inactive' });
    }
    if (coupon.startDate > now) {
      return res.status(400).json({ success: false, message: 'Coupon not yet active' });
    }
    if (coupon.endDate < now) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (coupon.usedBy && coupon.usedBy.some((userId) => userId.equals(req.user._id))) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    const orderAmount = await getCartSubtotal(req.user._id);
    if (orderAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else {
      discount = coupon.discountValue;
    }
    res.json({ success: true, coupon, discount, orderAmount });
  } catch (error) {
    next(error);
  }
};
