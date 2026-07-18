import B2BCoupon from '../models/B2BCoupon.js';

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
  if (next.perUserLimit === undefined && next.usageLimit !== undefined) {
    next.perUserLimit = next.usageLimit;
  }
  delete next.usageLimit;
  if (next.perUserLimit === '' || next.perUserLimit === null) {
    next.perUserLimit = null;
  } else if (next.perUserLimit !== undefined) {
    next.perUserLimit = Number(next.perUserLimit);
  }
  return next;
};

const validateRules = (couponData) => {
  if (couponData.discountType === 'percentage' && Number(couponData.discountValue) > 100) {
    return 'Percentage discount cannot exceed 100%';
  }
  if (couponData.startDate && couponData.endDate && new Date(couponData.endDate) <= new Date(couponData.startDate)) {
    return 'End date must be after start date';
  }
  if (couponData.maxDiscountAmount !== null && couponData.maxDiscountAmount !== undefined && Number(couponData.maxDiscountAmount) < 0) {
    return 'Maximum discount amount must be zero or greater';
  }
  if (couponData.perUserLimit !== null && couponData.perUserLimit !== undefined && Number(couponData.perUserLimit) < 1) {
    return 'Per user limit must be at least 1 or left empty for unlimited use';
  }
  return null;
};

const getPerUserLimit = (coupon) => coupon.perUserLimit ?? coupon.usageLimit ?? null;

const getUserCouponUsage = (coupon, userId) => {
  const usage = coupon.usageByUser?.find((entry) => entry.user?.equals(userId));
  if (usage) return usage.count || 0;
  return coupon.usedBy?.some((id) => id.equals(userId)) ? 1 : 0;
};

const incrementUserCouponUsage = async ({ coupon, userId, session }) => {
  const updatedExisting = await B2BCoupon.updateOne(
    { _id: coupon._id, 'usageByUser.user': userId },
    { $inc: { usageCount: 1, 'usageByUser.$.count': 1 }, $addToSet: { usedBy: userId } },
    { session }
  );

  if (updatedExisting.matchedCount === 0) {
    await B2BCoupon.findByIdAndUpdate(
      coupon._id,
      {
        $inc: { usageCount: 1 },
        $addToSet: { usedBy: userId },
        $push: { usageByUser: { user: userId, count: getUserCouponUsage(coupon, userId) + 1 } },
      },
      { session }
    );
  }
};

const calculateDiscount = (coupon, orderAmount) => {
  if (coupon.discountType === 'percentage') {
    const discount = (orderAmount * coupon.discountValue) / 100;
    return coupon.maxDiscountAmount ? Math.min(discount, coupon.maxDiscountAmount) : discount;
  }
  return Math.min(coupon.discountValue, orderAmount);
};

const getUsableCoupon = async (code, userId) => {
  const now = new Date();
  const coupon = await B2BCoupon.findOne({ code: String(code || '').trim().toUpperCase() });
  if (!coupon) return { error: { status: 404, message: 'Invalid B2B coupon code' } };
  if (!coupon.isActive) return { error: { status: 400, message: 'B2B coupon is inactive' } };
  if (coupon.startDate > now) return { error: { status: 400, message: 'B2B coupon not yet active' } };
  if (coupon.endDate < now) return { error: { status: 400, message: 'B2B coupon has expired' } };
  const perUserLimit = getPerUserLimit(coupon);
  if (perUserLimit && getUserCouponUsage(coupon, userId) >= perUserLimit) {
    return { error: { status: 400, message: `You have reached the per-user limit for this B2B coupon (${perUserLimit})` } };
  }
  return { coupon };
};

export const getB2BCoupons = async (req, res, next) => {
  try {
    const coupons = await B2BCoupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

export const getActiveB2BCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await B2BCoupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

export const createB2BCoupon = async (req, res, next) => {
  try {
    const payload = normalizeCouponPayload(req.body);
    const ruleError = validateRules(payload);
    if (ruleError) return res.status(400).json({ success: false, message: ruleError });
    const coupon = await B2BCoupon.create(payload);
    res.status(201).json({ success: true, message: 'B2B coupon created', coupon });
  } catch (error) {
    next(error);
  }
};

export const updateB2BCoupon = async (req, res, next) => {
  try {
    const existing = await B2BCoupon.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'B2B coupon not found' });
    const payload = normalizeCouponPayload(req.body);
    const ruleError = validateRules({ ...existing.toObject(), ...payload });
    if (ruleError) return res.status(400).json({ success: false, message: ruleError });
    const coupon = await B2BCoupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json({ success: true, message: 'B2B coupon updated', coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteB2BCoupon = async (req, res, next) => {
  try {
    const coupon = await B2BCoupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'B2B coupon not found' });
    res.json({ success: true, message: 'B2B coupon deleted' });
  } catch (error) {
    next(error);
  }
};

export const validateB2BCoupon = async (req, res, next) => {
  try {
    const orderAmount = Number(req.body.orderAmount || 0);
    if (orderAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid B2B order amount' });
    const { coupon, error } = await getUsableCoupon(req.body.code, req.user._id);
    if (error) return res.status(error.status).json({ success: false, message: error.message });
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum B2B order amount is ${coupon.minOrderAmount}` });
    }
    const discount = calculateDiscount(coupon, orderAmount);
    res.json({ success: true, coupon, discount });
  } catch (error) {
    next(error);
  }
};

export const resolveB2BCouponForOrder = async ({ code, userId, orderAmount, session }) => {
  if (!code) return { couponDiscount: 0, coupon: null };
  const { coupon, error } = await getUsableCoupon(code, userId);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = error.status;
    throw err;
  }
  if (orderAmount < coupon.minOrderAmount) {
    const err = new Error(`Minimum B2B order amount is ${coupon.minOrderAmount}`);
    err.statusCode = 400;
    throw err;
  }
  const couponDiscount = calculateDiscount(coupon, orderAmount);
  await incrementUserCouponUsage({ coupon, userId, session });
  return { couponDiscount, coupon };
};
