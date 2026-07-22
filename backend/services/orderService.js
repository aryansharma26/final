import Product from '../models/Product.js';
import B2BProduct from '../models/B2BProduct.js';
import Setting from '../models/Setting.js';
import Prescription from '../models/Prescription.js';
import { sendEmail, getOrderConfirmationTemplate } from '../utils/sendEmail.js';

// ─── Constants ───

export const SHIPPING_THRESHOLD = 2000;
export const SHIPPING_COST = 50;
export const DEFAULT_TAX_RATE = 12;
export const SENIOR_DISCOUNT_RATE = 0.20;

// ─── Pricing Helpers ───

/**
 * Extracts the first image URL from a product's images array.
 * Handles both object ({ url, public_id }) and legacy string formats.
 */
export const getProductImage = (images, fallback = '') => {
  if (!images || images.length === 0) return fallback;
  const first = images[0];
  return first?.url || (typeof first === 'string' ? first : '') || fallback;
};

/**
 * Resolves the effective unit price for a product considering discount and bulk pricing tiers.
 */
export const resolveProductPrice = (product, quantity) => {
  let price = product.discountPrice > 0 ? product.discountPrice : product.price;
  if (product.bulkPricing && product.bulkPricing.length > 0) {
    const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
    const matchingTier = sortedTiers.find(tier => quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty));
    if (matchingTier) {
      price = matchingTier.unitPrice;
    }
  }
  return price;
};

/**
 * Calculates inclusive tax for a line total.
 * Tax is already included in the price, so this extracts the tax portion.
 * Formula: lineTotal × (rate / (100 + rate))
 */
export const calculateItemTax = (lineTotal, taxRate) => {
  const rate = taxRate !== undefined ? taxRate : DEFAULT_TAX_RATE;
  return lineTotal * (rate / (100 + rate));
};

/**
 * Calculates shipping cost based on items price threshold.
 * Free shipping above SHIPPING_THRESHOLD, otherwise SHIPPING_COST.
 */
export const calculateShipping = (itemsPrice) => {
  return itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
};

/**
 * Calculates senior citizen discount (20% of items price).
 * Only applied if both isSeniorCitizen flag is set and ID document is provided.
 */
export const calculateSeniorDiscount = (itemsPrice, isSeniorCitizen, seniorCitizenIdDoc) => {
  return (isSeniorCitizen && seniorCitizenIdDoc)
    ? Number((itemsPrice * SENIOR_DISCOUNT_RATE).toFixed(2))
    : 0;
};

/**
 * Resolves checkout offer discount from the promo_banner settings document.
 */
export const resolveCheckoutOffer = async (itemsPrice, session) => {
  const settings = await Setting.findOne({ key: 'promo_banner' }).session(session);
  if (settings && settings.value?.checkoutDiscount?.enabled) {
    const config = settings.value.checkoutDiscount;
    if (itemsPrice >= config.minOrderAmount) {
      return Number((itemsPrice * (config.discountPercentage / 100)).toFixed(2));
    }
  }
  return 0;
};

/**
 * Calculates the final order total price after all discounts.
 * Ensures the total never goes below zero.
 */
export const calculateTotalPrice = (itemsPrice, shippingPrice, couponDiscount, seniorDiscount, checkoutOfferDiscount) => {
  return Math.max(0, itemsPrice + shippingPrice - couponDiscount - seniorDiscount - checkoutOfferDiscount);
};

// ─── Stock Operations ───

/**
 * Atomically deducts stock for a product within a transaction.
 * Uses a $gte guard to prevent negative stock from race conditions.
 * @returns {boolean} true if stock was successfully deducted, false if insufficient.
 */
export const deductStockAtomic = async (productId, quantity, Model, session) => {
  const updated = await Model.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { session }
  );
  return !!updated;
};

/**
 * Restores stock for all items in an order (used during cancellation or status reversal).
 * Handles both regular Product and B2B Product models via the isB2B flag on each item.
 */
export const restoreStock = async (orderItems) => {
  for (const item of orderItems) {
    if (!item.product) continue;
    const Model = item.isB2B ? B2BProduct : Product;
    await Model.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
};

// ─── Prescription Check ───

/**
 * Checks if a user has a pending or approved prescription for a specific product.
 * @param {ObjectId} userId
 * @param {ObjectId} productId
 * @param {ClientSession|null} [session=null] - Optional Mongoose session for transactions
 */
export const hasAcceptedPrescriptionForProduct = async (userId, productId, session = null) => {
  const query = Prescription.findOne({
    user: userId,
    requestedProduct: productId,
  }).sort({ uploadedAt: -1 });
  if (session) query.session(session);
  return ['pending', 'approved'].includes((await query)?.status);
};

// ─── Email ───

/**
 * Sends an order confirmation email. Non-critical — errors are logged but never thrown,
 * so they don't affect the order placement response.
 */
export const sendOrderConfirmationEmail = async (order, userEmail) => {
  try {
    await sendEmail({
      to: userEmail,
      subject: `Order Confirmed - ${order._id}`,
      html: getOrderConfirmationTemplate(order),
    });
  } catch (emailError) {
    console.error('[Order] Confirmation email failed:', emailError.message);
  }
};
