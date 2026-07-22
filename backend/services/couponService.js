import Coupon from '../models/Coupon.js';

/**
 * Gets the per-user usage limit for a coupon.
 * Falls back to usageLimit for backward compatibility.
 */
export const getCouponPerUserLimit = (coupon) => coupon.perUserLimit ?? coupon.usageLimit ?? null;

/**
 * Gets how many times a user has used a specific coupon.
 * Checks usageByUser array first, then falls back to usedBy presence.
 */
export const getUserCouponUsage = (coupon, userId) => {
  const usage = coupon.usageByUser?.find((entry) => entry.user?.equals(userId));
  if (usage) return usage.count || 0;
  return coupon.usedBy?.some((id) => id.equals(userId)) ? 1 : 0;
};

/**
 * Atomically increments the per-user usage counter for a coupon.
 * Uses upsert pattern: tries to update existing usageByUser entry first,
 * creates a new one if the user has no existing entry.
 */
export const incrementUserCouponUsage = async ({ coupon, userId, session }) => {
  const updatedExisting = await Coupon.updateOne(
    { _id: coupon._id, 'usageByUser.user': userId },
    { $inc: { usageCount: 1, 'usageByUser.$.count': 1 }, $addToSet: { usedBy: userId } },
    { session }
  );

  if (updatedExisting.matchedCount === 0) {
    await Coupon.findByIdAndUpdate(
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

/**
 * Resolves a regular (non-B2B) coupon for order placement.
 *
 * @param {Object} params
 * @param {string}  params.couponCode  - The coupon code to apply
 * @param {ObjectId} params.userId     - The user applying the coupon
 * @param {number}  params.itemsPrice  - Subtotal to check minimum and calculate discount
 * @param {ObjectId|null} [params.cartCouponId] - If provided (including null), validates that
 *   the coupon matches what was applied to the cart. Pass undefined to skip (e.g. Buy Now flow).
 * @param {ClientSession} params.session - Mongoose transaction session
 * @returns {{ couponDiscount: number, appliedCouponId: ObjectId|null, error: { status: number, message: string }|null }}
 */
export const resolveOrderCoupon = async ({ couponCode, userId, itemsPrice, cartCouponId, session }) => {
  const noDiscount = { couponDiscount: 0, appliedCouponId: null, error: null };

  if (!couponCode) return noDiscount;

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);
  if (!coupon) return noDiscount;

  // Per-user limit check — hard error if exceeded (even if dates are invalid)
  const perUserLimit = getCouponPerUserLimit(coupon);
  if (perUserLimit && getUserCouponUsage(coupon, userId) >= perUserLimit) {
    return {
      couponDiscount: 0,
      appliedCouponId: null,
      error: { status: 400, message: `You have reached the per-user limit for this coupon (${perUserLimit})` },
    };
  }

  // Date validation — silent skip if invalid
  const now = new Date();
  if (coupon.startDate > now || coupon.endDate <= now) return noDiscount;

  // Minimum order amount — silent skip if not met
  if (itemsPrice < coupon.minOrderAmount) return noDiscount;

  // Cart-specific: verify coupon was applied to the cart before checkout
  if (cartCouponId !== undefined) {
    if (!cartCouponId || !cartCouponId.equals(coupon._id)) {
      return {
        couponDiscount: 0,
        appliedCouponId: null,
        error: { status: 400, message: 'Coupon not applied to cart. Please apply it first.' },
      };
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (itemsPrice * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  } else {
    discount = coupon.discountValue;
  }

  await incrementUserCouponUsage({ coupon, userId, session });

  return { couponDiscount: discount, appliedCouponId: coupon._id, error: null };
};
