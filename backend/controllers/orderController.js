import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import B2BProduct from '../models/B2BProduct.js';
import Coupon from '../models/Coupon.js';
import Prescription from '../models/Prescription.js';
import Setting from '../models/Setting.js';
import { resolveB2BCouponForOrder } from './b2bCouponController.js';
import { sendEmail, getOrderConfirmationTemplate } from '../utils/sendEmail.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const TAX_RATE = 0.05;
const SHIPPING_THRESHOLD = 2000;
const SHIPPING_COST = 50;

const hasAcceptedPrescriptionForProduct = async (userId, productId, session) => {
  const prescription = await Prescription.findOne({
    user: userId,
    requestedProduct: productId,
  }).sort({ uploadedAt: -1 }).session(session);
  return ['pending', 'approved'].includes(prescription?.status);
};

const VALID_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
  confirmed: ['pending', 'packed', 'shipped', 'delivered', 'cancelled'],
  packed: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  shipped: ['pending', 'confirmed', 'packed', 'delivered', 'cancelled'],
  delivered: ['pending', 'confirmed', 'packed', 'shipped', 'cancelled'],
  cancelled: ['pending', 'confirmed', 'packed', 'shipped', 'delivered'],
};

export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { shippingAddress, paymentMethod, couponCode, isB2B, b2bItem, isSeniorCitizen, seniorCitizenIdDoc } = req.body;

    if (isB2B && b2bItem?.productId) {
      const quantity = Math.max(1, Number(b2bItem.quantity || 1));
      const requestedPrice = Number(b2bItem.price || 0);
      const product = await B2BProduct.findById(b2bItem.productId).session(session);

      if (!product || product.status !== 'active') {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'B2B product not found or unavailable' });
      }
      if (product.stock < quantity) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Only ${product.stock} available.` });
      }

      const selectedTier = product.bulkPricing?.find((tier) =>
        Number(tier.unitPrice) === requestedPrice &&
        (!b2bItem.tierLabel || tier.label === b2bItem.tierLabel)
      );
      const price = Number(selectedTier?.unitPrice || requestedPrice);
      if (!price || price <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Invalid B2B pricing option' });
      }

      const image = product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || b2bItem.image || '';
      const orderItems = [{
        product: product._id,
        name: product.name,
        image,
        productSlug: product.slug,
        price,
        quantity,
        isB2B: true,
        tierLabel: selectedTier?.label || b2bItem.tierLabel || 'Bulk Tier',
      }];
      const itemsPrice = price * quantity;
      const itemTaxRate = product.taxRate !== undefined ? product.taxRate : 12;
      const taxPrice = Number((itemsPrice * (itemTaxRate / (100 + itemTaxRate))).toFixed(2));
      const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      const { couponDiscount, coupon: appliedB2BCoupon } = await resolveB2BCouponForOrder({
        code: b2bItem.couponCode || req.body.b2bCouponCode,
        userId: req.user._id,
        orderAmount: itemsPrice,
        session,
      });
      const totalPrice = Math.max(0, itemsPrice + shippingPrice - couponDiscount);

      const [order] = await Order.create(
        [{
          user: req.user._id,
          orderItems,
          isB2B: true,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          couponDiscount,
          seniorDiscount: 0,
          checkoutOfferDiscount: 0,
          isSeniorCitizen: false,
          seniorCitizenIdDoc: '',
          seniorCitizenStatus: 'none',
          totalPrice,
          coupon: appliedB2BCoupon?._id || null,
          couponModel: appliedB2BCoupon ? 'B2BCoupon' : 'Coupon',
        }],
        { session }
      );

      const updated = await B2BProduct.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { session }
      );
      if (!updated) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Stock changed during checkout. Please try again.',
        });
      }

      await session.commitTransaction();

      try {
        await sendEmail({
          to: req.user.email,
          subject: `Order Confirmed - ${order._id}`,
          html: getOrderConfirmationTemplate(order),
        });
      } catch (emailError) {
        console.error('[Order] Confirmation email failed:', emailError.message);
      }

      return res.status(201).json({ success: true, message: 'Order placed successfully', order });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product').session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check for prescription-required items
    const prescriptionItems = cart.items.filter((item) => item.product.isPrescriptionRequired);
    if (prescriptionItems.length > 0) {
      const missingPrescriptionItems = [];
      for (const item of prescriptionItems) {
        const hasPrescription = await hasAcceptedPrescriptionForProduct(req.user._id, item.product._id, session);
        if (!hasPrescription) {
          missingPrescriptionItems.push(item.product.name);
        }
      }

      if (missingPrescriptionItems.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Some items in your cart require a prescription upload before checkout.',
          prescriptionItems: missingPrescriptionItems,
        });
      }
    }

    // Validate stock and validate/recalculate group/bulk price within transaction
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session);
      if (!product || product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product?.name || 'a product'}. Only ${product?.stock || 0} left.`,
        });
      }

      // Calculate bulk pricing / group offer price
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

    const itemsPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const seniorDiscount = (isSeniorCitizen && seniorCitizenIdDoc)
      ? Number((itemsPrice * 0.20).toFixed(2))
      : 0;
    const orderItems = cart.items.map((item) => {
      const originalPrice = Number(item.price || 0);
      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.images[0]?.url || (typeof item.product.images[0] === 'string' ? item.product.images[0] : '') || '',
        productSlug: item.product.slug,
        price: originalPrice,
        originalPrice,
        quantity: item.quantity,
      };
    });

    let couponDiscount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);
      if (coupon && coupon.endDate > new Date() && (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)) {
        if (itemsPrice >= coupon.minOrderAmount) {
          // Verify user hasn't already used this coupon in a previous order
          if (coupon.usedBy && coupon.usedBy.some((userId) => userId.equals(req.user._id))) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'You have already used this coupon' });
          }
          // Verify coupon was actually applied to the cart
          if (!cart.coupon || !cart.coupon.equals(coupon._id)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Coupon not applied to cart. Please apply it first.' });
          }
          if (coupon.discountType === 'percentage') {
            couponDiscount = (itemsPrice * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
          } else {
            couponDiscount = coupon.discountValue;
          }
          // Atomic coupon update to prevent race conditions
          await Coupon.findByIdAndUpdate(
            coupon._id,
            { $inc: { usageCount: 1 }, $addToSet: { usedBy: req.user._id } },
            { session }
          );
          appliedCoupon = coupon._id;
        }
      }
    }

    let calculatedTax = 0;
    for (const item of cart.items) {
      const rate = item.product.taxRate !== undefined ? item.product.taxRate : 12;
      const itemTax = (item.price * item.quantity) * (rate / (100 + rate));
      calculatedTax += itemTax;
    }
    const taxPrice = Number(calculatedTax.toFixed(2));
    const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    let checkoutOfferDiscount = 0;
    const settings = await Setting.findOne({ key: 'promo_banner' }).session(session);
    if (settings && settings.value?.checkoutDiscount?.enabled) {
      const config = settings.value.checkoutDiscount;
      if (itemsPrice >= config.minOrderAmount) {
        checkoutOfferDiscount = Number((itemsPrice * (config.discountPercentage / 100)).toFixed(2));
      }
    }

    let totalPrice = itemsPrice + shippingPrice - couponDiscount - seniorDiscount - checkoutOfferDiscount;
    if (totalPrice < 0) totalPrice = 0;

    const [order] = await Order.create(
      [{
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        couponDiscount,
        seniorDiscount,
        checkoutOfferDiscount,
        isSeniorCitizen: !!isSeniorCitizen,
        seniorCitizenIdDoc: seniorCitizenIdDoc || '',
        seniorCitizenStatus: (isSeniorCitizen && seniorCitizenIdDoc) ? 'pending' : 'none',
        totalPrice,
        coupon: appliedCoupon,
        couponModel: 'Coupon',
      }],
      { session }
    );

    // Atomic stock deduction within transaction
    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );
      if (!updated) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Stock changed during checkout. Please review your cart and try again.',
        });
      }
    }

    // Clear cart within transaction
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], coupon: null, couponDiscount: 0 },
      { session }
    );

    await session.commitTransaction();

    // Send email after transaction (non-critical)
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Order Confirmed - ${order._id}`,
        html: getOrderConfirmationTemplate(order),
      });
    } catch (emailError) {
      console.error('[Order] Confirmation email failed:', emailError.message);
    }

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name images slug')
      .populate('prescription', 'originalFileName status uploadedAt');
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const isAdmin = req.admin?.role === 'admin' || req.admin?.role === 'superadmin';
    const query = isAdmin ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const order = await Order.findOne(query)
      .populate('orderItems.product', 'name images slug')
      .populate('prescription', 'originalFileName status uploadedAt')
      .populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, isB2B, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (isB2B !== undefined && isB2B !== '') {
      query.isB2B = isB2B === 'true';
    }
    const isExport = req.query.export === 'true';
    const pageNum = Math.max(1, Number(page));
    const limitNum = isExport ? 10000 : Math.max(1, Math.min(100, Number(limit)));
    const skip = isExport ? 0 : (pageNum - 1) * limitNum;
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images slug')
      .populate('prescription', 'originalFileName status uploadedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await Order.countDocuments(query);
    res.json({ success: true, count: orders.length, orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    next(error);
  }
};

export const getB2BPurchaseReport = async (req, res, next) => {
  try {
    const { product, page = 1 } = req.query;
    const isExport = req.query.export === 'true';
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = isExport ? 10000 : Math.max(1, Math.min(100, Number(req.query.limit) || 50));

    const productQuery = {};
    if (product) {
      if (!mongoose.isValidObjectId(product)) {
        return res.status(400).json({ success: false, message: 'Invalid B2B product ID' });
      }
      productQuery._id = product;
    }

    const products = await B2BProduct.find(productQuery)
      .select('name brand slug sku')
      .lean();
    const productIds = products.map((item) => item._id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        rows: [],
        total: 0,
        pagination: { page: 1, limit: limitNum, total: 0, pages: 1 },
      });
    }

    const productsById = new Map(products.map((item) => [item._id.toString(), item]));
    const orders = await Order.find({
      $or: [
        { isB2B: true },
        { 'orderItems.isB2B': true },
      ],
      'orderItems.product': { $in: productIds },
    })
      .select('user orderItems status shippingAddress totalPrice createdAt')
      .populate('user', 'name email phone isActive addresses createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const rowsByUserProductTier = new Map();

    orders.forEach((order) => {
      const user = order.user;
      if (!user?._id) return;

      (order.orderItems || []).forEach((item) => {
        if (!order.isB2B && !item.isB2B) return;
        const productId = item.product?.toString();
        const b2bProduct = productId ? productsById.get(productId) : null;
        if (!b2bProduct) return;

        const tierLabel = item.tierLabel || 'Bulk Tier';
        const rowKey = `${user._id}-${productId}-${tierLabel}`;
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        if (!rowsByUserProductTier.has(rowKey)) {
          const defaultAddress = (user.addresses || []).find((addr) => addr.isDefault) || (user.addresses || [])[0] || order.shippingAddress || {};
          rowsByUserProductTier.set(rowKey, {
            userId: user._id,
            userCode: user._id.toString().slice(-6).toUpperCase(),
            userName: user.name || order.shippingAddress?.name || 'Unknown user',
            email: user.email || '',
            phone: user.phone || order.shippingAddress?.phone || '',
            status: user.isActive ? 'Active' : 'Blocked',
            city: defaultAddress.cityMunicipality || '',
            province: defaultAddress.province || '',
            productId,
            productName: b2bProduct.name || item.name || 'Unknown B2B product',
            brand: b2bProduct.brand || '',
            sku: b2bProduct.sku || '',
            tierLabel,
            unitPrice: price,
            totalQuantity: 0,
            totalSpent: 0,
            orderIds: new Set(),
            statuses: new Set(),
            lastOrderedAt: order.createdAt,
          });
        }

        const row = rowsByUserProductTier.get(rowKey);
        row.totalQuantity += quantity;
        row.totalSpent += quantity * price;
        row.orderIds.add(order._id.toString());
        if (order.status) row.statuses.add(order.status);
        if (!row.lastOrderedAt || new Date(order.createdAt) > new Date(row.lastOrderedAt)) {
          row.lastOrderedAt = order.createdAt;
        }
      });
    });

    const rows = Array.from(rowsByUserProductTier.values())
      .map((row) => {
        const orderIds = Array.from(row.orderIds);
        const statuses = Array.from(row.statuses);
        return {
          ...row,
          orderCount: orderIds.length,
          orderIds,
          orderCodes: orderIds.map((id) => id.slice(-6).toUpperCase()).join(', '),
          statuses,
          orderStatuses: statuses.join(', '),
        };
      })
      .sort((a, b) => new Date(b.lastOrderedAt || 0) - new Date(a.lastOrderedAt || 0));

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const safePage = Math.min(pageNum, pages);
    const start = isExport ? 0 : (safePage - 1) * limitNum;
    const pagedRows = isExport ? rows : rows.slice(start, start + limitNum);

    res.json({
      success: true,
      rows: pagedRows,
      total,
      pagination: { page: safePage, limit: limitNum, total, pages },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
    if (!validTransitions.includes(status) && order.status !== status) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'`,
      });
    }

    const shouldRestoreStock = status === 'cancelled' && order.status !== 'cancelled';
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;
    if (shouldRestoreStock) {
      for (const item of order.orderItems) {
        if (!item.product) continue;
        if (item.isB2B) {
          await B2BProduct.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        } else {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    }
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cod' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          ...(order.paymentResult || {}),
          status: 'paid_on_delivery',
          update_time: new Date().toISOString(),
        };
      }
    }
    await order.save();
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel shipped or delivered order' });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock only once
    for (const item of order.orderItems) {
      if (!item.product) continue;
      if (item.isB2B) {
        await B2BProduct.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const activeOrderMatch = { createdAt: { $gte: since }, status: { $ne: 'cancelled' } };
    const totalOrders = await Order.countDocuments({ createdAt: { $gte: since } });
    const totalRevenue = await Order.aggregate([
      { $match: activeOrderMatch },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const statusCounts = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusCounts: statusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    // COD-only: payment is always "verified" since no online payment gateway is configured
    res.json({ success: true, message: 'Payment verified (COD)', verified: true });
  } catch (error) {
    next(error);
  }
};

export const uploadSeniorDoc = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ success: false, message: 'Uploads are currently unavailable. Cloudinary is not configured.' });
    }
    const uploadStream = (file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'capsandpills/senior_docs',
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });
    };
    const result = await uploadStream(req.file);
    res.json({ success: true, url: result.secure_url || result.url });
  } catch (error) {
    next(error);
  }
};

export const verifySeniorCitizenDoc = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.isSeniorCitizen) {
      return res.status(400).json({ success: false, message: 'Order is not flagged for senior citizen discount' });
    }
    order.seniorCitizenStatus = status;
    await order.save();
    res.json({ success: true, message: `Senior citizen document status updated to ${status}`, order });
  } catch (error) {
    next(error);
  }
};
