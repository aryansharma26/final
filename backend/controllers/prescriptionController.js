import mongoose from 'mongoose';
import Prescription from '../models/Prescription.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const PRESCRIPTION_FOLDER = 'capsandpills/prescriptions';

const uploadPrescriptionToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: PRESCRIPTION_FOLDER,
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

const deleteCloudinaryPrescription = async (publicId, fileType = '') => {
  if (!publicId) return;
  const firstType = fileType === 'application/pdf' ? 'raw' : 'image';
  const resourceTypes = Array.from(new Set([firstType, 'image', 'raw']));

  for (const resourceType of resourceTypes) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (result?.result === 'ok') return;
    } catch (error) {
      if (resourceType === resourceTypes[resourceTypes.length - 1]) {
        console.error('Failed to delete Cloudinary prescription:', error.message);
      }
    }
  }
};

const sendPrescriptionFile = async (res, prescription, disposition = 'attachment') => {
  if (!prescription.url) {
    return res.status(404).json({ success: false, message: 'Prescription file is not available' });
  }

  const response = await fetch(prescription.url);
  if (!response.ok) {
    return res.status(404).json({ success: false, message: 'Prescription file not found' });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = String(prescription.originalFileName || 'prescription').replace(/["\r\n]/g, '');
  res.setHeader('Content-Type', prescription.fileType || response.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
  return res.send(buffer);
};

const cancelOrdersForRejectedPrescription = async (prescription) => {
  if (!prescription.requestedProduct) {
    return { cancelledCount: 0 };
  }
  const productId = prescription.requestedProduct._id || prescription.requestedProduct;
  const userId = prescription.user._id || prescription.user;
  const latestPrescription = await Prescription.findOne({
    user: userId,
    requestedProduct: productId,
  }).sort({ uploadedAt: -1 });

  if (!latestPrescription || latestPrescription._id.toString() !== prescription._id.toString()) {
    return { cancelledCount: 0 };
  }

  const orders = await Order.find({
    user: userId,
    status: { $nin: ['cancelled', 'delivered'] },
    'orderItems.product': productId,
  });

  for (const order of orders) {
    order.status = 'cancelled';
    order.notes = [
      order.notes,
      'Order cancelled automatically because the prescription for a prescription-required product was rejected.',
    ].filter(Boolean).join('\n');

    for (const item of order.orderItems) {
      if (!item.product) continue;
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    await order.save();
  }

  return { cancelledCount: orders.length };
};

const parseDeliveryAddress = (body = {}) => {
  if (body.deliveryAddress) {
    try {
      const parsed = typeof body.deliveryAddress === 'string'
        ? JSON.parse(body.deliveryAddress)
        : body.deliveryAddress;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return {};
    }
  }

  return {
    name: body.name,
    phone: body.phone,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    province: body.province,
    cityMunicipality: body.cityMunicipality,
    barangay: body.barangay,
    zipCode: body.zipCode,
    country: body.country,
  };
};

const cleanDeliveryAddress = (address = {}) => ({
  name: String(address.name || '').trim(),
  phone: String(address.phone || '').trim(),
  addressLine1: String(address.addressLine1 || '').trim(),
  addressLine2: String(address.addressLine2 || '').trim(),
  province: String(address.province || '').trim(),
  cityMunicipality: String(address.cityMunicipality || '').trim(),
  barangay: String(address.barangay || '').trim(),
  zipCode: String(address.zipCode || '').trim(),
  country: String(address.country || 'Philippines').trim() || 'Philippines',
});

/* ─── User upload ─── */
export const uploadPrescription = async (req, res, next) => {
  let uploadedFile = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ success: false, message: 'Prescription uploads are currently unavailable. Cloudinary is not configured.' });
    }
    const { productId } = req.body;
    const deliveryAddress = cleanDeliveryAddress(parseDeliveryAddress(req.body));
    if (productId) {
      const product = await Product.findById(productId).select('_id');
      if (!product) {
        return res.status(404).json({ success: false, message: 'Requested product not found' });
      }
    }
    uploadedFile = await uploadPrescriptionToCloudinary(req.file);
    const prescription = await Prescription.create({
      user: req.user._id,
      url: uploadedFile.secure_url || uploadedFile.url,
      public_id: uploadedFile.public_id,
      fileName: uploadedFile.public_id,
      fileType: req.file.mimetype,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      status: 'pending',
      requestedProduct: productId || null,
      deliveryAddress,
    });

    res.status(201).json({ success: true, message: 'Prescription uploaded successfully', prescription });
  } catch (error) {
    if (uploadedFile?.public_id) {
      await deleteCloudinaryPrescription(uploadedFile.public_id, req.file?.mimetype);
    }
    next(error);
  }
};

/* ─── User list ─── */
export const getMyPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user._id })
      .populate('requestedProduct', 'name brand slug images')
      .populate('quoteItems.product', 'name brand slug images stock status')
      .sort({ uploadedAt: -1 });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin list ─── */
export const getAllPrescriptions = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      const User = (await import('../models/User.js')).default;
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const userIds = users.map((u) => u._id.toString());
      query.user = { $in: userIds };
    }
    const isExport = req.query.export === 'true';
    const limitNum = isExport ? 10000 : Number(limit);
    const skip = isExport ? 0 : (Number(page) - 1) * limitNum;
    const prescriptions = await Prescription.find(query)
      .populate('user', 'name email phone')
      .populate('requestedProduct', 'name brand slug images')
      .populate('quoteItems.product', 'name brand slug images stock status')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await Prescription.countDocuments(query);
    res.json({ success: true, prescriptions, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin stats ─── */
export const getPrescriptionStats = async (req, res, next) => {
  try {
    const total = await Prescription.countDocuments();
    const pending = await Prescription.countDocuments({ status: 'pending' });
    const approved = await Prescription.countDocuments({ status: 'approved' });
    const rejected = await Prescription.countDocuments({ status: 'rejected' });
    res.json({ success: true, stats: { total, pending, approved, rejected } });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin view/download ─── */
export const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('requestedProduct', 'name brand slug images')
      .populate('quoteItems.product', 'name brand slug images stock status');
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    res.json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};

export const downloadPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    return sendPrescriptionFile(res, prescription);
  } catch (error) {
    next(error);
  }
};

export const viewPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    return sendPrescriptionFile(res, prescription, 'inline');
  } catch (error) {
    next(error);
  }
};

export const downloadMyPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, user: req.user._id });
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    return sendPrescriptionFile(res, prescription);
  } catch (error) {
    next(error);
  }
};

export const viewMyPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, user: req.user._id });
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    return sendPrescriptionFile(res, prescription, 'inline');
  } catch (error) {
    next(error);
  }
};

/* ─── Admin review ─── */
export const reviewPrescription = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes, reviewedAt: new Date() },
      { new: true }
    ).populate('user', 'name email phone').populate('requestedProduct', 'name brand slug');
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    const orderResult = status === 'rejected'
      ? await cancelOrdersForRejectedPrescription(prescription)
      : { cancelledCount: 0 };

    res.json({
      success: true,
      message: orderResult.cancelledCount > 0
        ? `Prescription ${status}. ${orderResult.cancelledCount} related order(s) cancelled.`
        : `Prescription ${status}`,
      prescription,
      cancelledOrders: orderResult.cancelledCount,
    });
  } catch (error) {
    next(error);
  }
};

/* ─── User prescription status ─── */
export const updatePrescriptionQuote = async (req, res, next) => {
  try {
    const { items = [], quoteNotes = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one product to send a quote' });
    }

    const productIds = items.map((item) => item.product || item.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select('name slug images price discountPrice stock status taxRate');
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const quoteItems = items.map((item) => {
      const productId = String(item.product || item.productId || '');
      const product = productsById.get(productId);
      if (!product) return null;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const price = Number(item.price ?? (product.discountPrice > 0 ? product.discountPrice : product.price) ?? 0);
      const image = product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || '';
      return { product: product._id, name: product.name, image, price, quantity };
    }).filter(Boolean);

    if (quoteItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products selected' });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      {
        quoteItems,
        quoteNotes,
        quoteStatus: 'sent',
        quotedAt: new Date(),
        status: 'approved',
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('quoteItems.product', 'name brand slug images stock status');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, message: 'Prescription quote sent to customer', prescription });
  } catch (error) {
    next(error);
  }
};

export const createOrderFromPrescriptionQuote = async (req, res, next) => {
  return res.status(400).json({
    success: false,
    message: 'Please place prescription quote orders through checkout.',
  });
};

export const getPrescriptionStatus = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const productQuery = productId ? { requestedProduct: productId } : {};
    const acceptedStatuses = ['pending', 'approved'];

    const latestPrescription = await Prescription.findOne({ user: req.user._id, ...productQuery })
      .sort({ uploadedAt: -1 })
      .populate('requestedProduct', 'name brand slug');

    const canPurchase = latestPrescription && acceptedStatuses.includes(latestPrescription.status);

    const latestRejected = await Prescription.findOne({
      user: req.user._id,
      status: 'rejected',
      ...productQuery,
    })
      .sort({ reviewedAt: -1 })
      .populate('requestedProduct', 'name brand slug');

    res.json({
      success: true,
      hasApprovedPrescription: !!canPurchase,
      canPurchase: !!canPurchase,
      latestPrescription,
      latestRejected: latestRejected || null,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    await deleteCloudinaryPrescription(prescription.public_id, prescription.fileType);
    await prescription.deleteOne();
    res.json({ success: true, message: 'Prescription deleted' });
  } catch (error) {
    next(error);
  }
};
