import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Prescription from '../models/Prescription.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { phone, email } = req.body;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phone, email },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ success: false, message: 'Image uploads are currently unavailable. Cloudinary is not configured.' });
    }
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'capsandpills/avatars' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    ).select('-password -refreshToken');
    res.json({ success: true, message: 'Avatar updated', avatar: result.secure_url, user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshToken = null;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = req.body;
    if (user.addresses.length === 0) {
      address.isDefault = true;
    }
    if (address.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    user.addresses.push(address);
    await user.save();
    res.json({ success: true, message: 'Address added', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    if (!mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    Object.assign(address, req.body);
    if (req.body.isDefault) {
      user.addresses.forEach((a) => {
        if (a._id.toString() !== addressId) a.isDefault = false;
      });
    }
    await user.save();
    res.json({ success: true, message: 'Address updated', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    if (!mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((a) => a._id.toString() !== addressId);
    await user.save();
    res.json({ success: true, message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const isExport = req.query.export === 'true';
    let page = Math.max(1, Number(req.query.page) || 1);
    const limit = isExport ? 10000 : Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const { category } = req.query;

    let query = {};
    let exportFilterProductIds = null;
    if (category && mongoose.isValidObjectId(category)) {
      const subcats = await Category.find({ parent: category }).select('_id');
      const categoryIds = [category, ...subcats.map(c => c._id)];
      const products = await Product.find({ category: { $in: categoryIds } }).select('_id');
      const productIds = products.map(p => p._id);
      exportFilterProductIds = new Set(productIds.map((id) => id.toString()));
      const orders = await Order.find({ 'orderItems.product': { $in: productIds } }).select('user');
      const userIds = [...new Set(orders.map(o => o.user?.toString()).filter(Boolean))];
      query._id = { $in: userIds };
    }

    const total = await User.countDocuments(query);
    const [totalUsers, activeUsers, blockedUsers, verifiedUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: true }),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, pages);
    const skip = isExport ? 0 : Math.max(0, (page - 1) * limit);
    const users = await User.find(query).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    if (users.length > 0) {
      const userIds = users.map(u => u._id);
      const ordersStats = await Order.aggregate([
        { $match: { user: { $in: userIds } } },
        { 
          $group: { 
            _id: '$user', 
            totalSpent: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalPrice', 0] } },
            orderCount: { $sum: 1 } 
          } 
        }
      ]);

      let allUserOrders = [];
      let allUserCarts = [];
      let allUserPrescriptions = [];
      let productsById = new Map();
      if (isExport) {
        allUserOrders = await Order.find({ user: { $in: userIds } }).select('user orderItems').lean();
        allUserCarts = await Cart.find({ user: { $in: userIds } }).lean();
        allUserPrescriptions = await Prescription.find({ user: { $in: userIds } }).select('user').lean();
        const productIds = [
          ...new Set(
            allUserOrders
              .flatMap((order) => order.orderItems || [])
              .map((item) => item.product?.toString())
              .filter(Boolean)
          ),
        ];
        if (productIds.length > 0) {
          const products = await Product.find({ _id: { $in: productIds } })
            .select('name category')
            .populate({ path: 'category', select: 'name parent', populate: { path: 'parent', select: 'name' } })
            .lean();
          productsById = new Map(products.map((product) => [product._id.toString(), product]));
        }
      }

      users.forEach(user => {
        const uStats = ordersStats.find(s => s._id.toString() === user._id.toString());
        user.totalSpent = uStats ? uStats.totalSpent : 0;
        user.orderCount = uStats ? uStats.orderCount : 0;

        if (isExport) {
          // Default Address
          const defaultAddr = (user.addresses || []).find(addr => addr.isDefault) || (user.addresses || [])[0];
          user.defaultAddressName = defaultAddr ? (defaultAddr.name || '') : '';
          user.defaultAddressPhone = defaultAddr ? (defaultAddr.phone || '') : '';
          user.defaultAddressLine1 = defaultAddr ? (defaultAddr.addressLine1 || '') : '';
          user.defaultAddressLine2 = defaultAddr ? (defaultAddr.addressLine2 || '') : '';
          user.defaultAddressBarangay = defaultAddr ? (defaultAddr.barangay || '') : '';
          user.defaultAddressCity = defaultAddr ? (defaultAddr.cityMunicipality || '') : '';
          user.defaultAddressProvince = defaultAddr ? (defaultAddr.province || '') : '';
          user.defaultAddressZip = defaultAddr ? (defaultAddr.zipCode || '') : '';

          // Format all addresses combined
          const formattedAddresses = (user.addresses || []).map(addr => {
            const parts = [
              addr.addressLine1,
              addr.addressLine2,
              addr.barangay,
              addr.cityMunicipality,
              addr.province,
              addr.zipCode
            ].filter(Boolean);
            return `${addr.isDefault ? '[Default] ' : ''}${parts.join(', ')}`;
          }).join(' | ');
          user.formattedAddresses = formattedAddresses || 'No address added';

          // Cart Stats
          const userCart = allUserCarts.find(c => c.user.toString() === user._id.toString());
          let cartCount = 0;
          let cartValue = 0;
          if (userCart && userCart.items) {
            cartCount = userCart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            cartValue = userCart.items.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);
          }
          user.cartCount = cartCount;
          user.cartValue = cartValue;

          // Prescriptions count
          const userPrescriptionsCount = allUserPrescriptions.filter(p => p.user.toString() === user._id.toString()).length;
          user.prescriptionsCount = userPrescriptionsCount;

          // Purchased Medicines
          const userOrders = allUserOrders.filter(o => o.user.toString() === user._id.toString());
          const meds = new Set();
          const purchasedCategories = new Set();
          const purchasedSubcategories = new Set();
          userOrders.forEach(o => {
            (o.orderItems || []).forEach(item => {
              const productId = item.product?.toString();
              if (exportFilterProductIds && (!productId || !exportFilterProductIds.has(productId))) {
                return;
              }
              if (item.name) meds.add(item.name);
              const product = productId ? productsById.get(productId) : null;
              const category = product?.category;
              if (category?.parent) {
                purchasedCategories.add(category.parent.name || String(category.parent));
                purchasedSubcategories.add(category.name);
              } else if (category?.name) {
                purchasedCategories.add(category.name);
              }
            });
          });
          user.purchasedMedicines = Array.from(meds).join(', ') || 'No purchases';
          user.purchasedCategories = Array.from(purchasedCategories).join(', ') || 'No category purchases';
          user.purchasedSubcategories = Array.from(purchasedSubcategories).join(', ') || 'No subcategory purchases';
        }
      });
    }

    res.json({
      success: true,
      count: users.length,
      total,
      pagination: { page, limit, pages },
      users,
      stats: { totalUsers, activeUsers, blockedUsers, verifiedUsers }
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersByCategoryPurchase = async (req, res, next) => {
  try {
    const { category } = req.query;
    const isExport = req.query.export === 'true';
    let page = Math.max(1, Number(req.query.page) || 1);
    const limit = isExport ? 10000 : Math.max(1, Math.min(100, Number(req.query.limit) || 50));

    if (category && !mongoose.isValidObjectId(category)) {
      return res.status(400).json({ success: false, message: 'Please select a valid category or subcategory' });
    }

    let selectedCategory = null;
    let productQuery = {};

    if (category) {
      selectedCategory = await Category.findById(category).select('name parent').populate('parent', 'name').lean();
      if (!selectedCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const childCategories = await Category.find({ parent: category }).select('_id').lean();
      const categoryIds = [category, ...childCategories.map((c) => c._id)];
      productQuery = { category: { $in: categoryIds } };
    }

    const products = await Product.find(productQuery)
      .select('name brand slug category')
      .populate({ path: 'category', select: 'name parent', populate: { path: 'parent', select: 'name' } })
      .lean();

    const productIds = products.map((product) => product._id);
    if (productIds.length === 0) {
      return res.json({
        success: true,
        rows: [],
        total: 0,
        pagination: { page: 1, limit, pages: 1 },
        selectedCategory,
      });
    }

    const productsById = new Map(products.map((product) => [product._id.toString(), product]));
    const orders = await Order.find({ 'orderItems.product': { $in: productIds } })
      .select('user orderItems status totalPrice createdAt')
      .populate('user', 'name email phone isActive addresses createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const rowsByUserProduct = new Map();

    orders.forEach((order) => {
      const user = order.user;
      if (!user?._id) return;

      (order.orderItems || []).forEach((item) => {
        const productId = item.product?.toString();
        const product = productId ? productsById.get(productId) : null;
        if (!product) return;

        const productCategory = product.category;
        const categoryName = productCategory?.parent?.name || productCategory?.name || 'Uncategorized';
        const subcategoryName = productCategory?.parent ? productCategory.name : '';
        const rowKey = `${user._id}-${productId}`;
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        if (!rowsByUserProduct.has(rowKey)) {
          const defaultAddress = (user.addresses || []).find((addr) => addr.isDefault) || (user.addresses || [])[0];
          rowsByUserProduct.set(rowKey, {
            userId: user._id,
            userCode: user._id.toString().slice(-6).toUpperCase(),
            userName: user.name || 'Unknown user',
            email: user.email || '',
            phone: user.phone || '',
            status: user.isActive ? 'Active' : 'Blocked',
            city: defaultAddress?.cityMunicipality || '',
            province: defaultAddress?.province || '',
            productId,
            productName: product.name || item.name || 'Unknown product',
            brand: product.brand || '',
            slug: product.slug || '',
            categoryName,
            subcategoryName,
            totalQuantity: 0,
            totalSpent: 0,
            orderCount: 0,
            orderIds: new Set(),
            statuses: new Set(),
            lastOrderedAt: order.createdAt,
          });
        }

        const row = rowsByUserProduct.get(rowKey);
        row.totalQuantity += quantity;
        row.totalSpent += quantity * price;
        row.orderIds.add(order._id.toString());
        if (order.status) row.statuses.add(order.status);
        if (!row.lastOrderedAt || new Date(order.createdAt) > new Date(row.lastOrderedAt)) {
          row.lastOrderedAt = order.createdAt;
        }
      });
    });

    const rows = Array.from(rowsByUserProduct.values())
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
    const pages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, pages);
    const start = isExport ? 0 : (page - 1) * limit;
    const pagedRows = isExport ? rows : rows.slice(start, start + limit);

    res.json({
      success: true,
      rows: pagedRows,
      total,
      pagination: { page, limit, pages },
      selectedCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const [orders, cart, prescriptions] = await Promise.all([
      Order.find({ user: user._id })
        .populate('orderItems.product', 'name slug images')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Cart.findOne({ user: user._id })
        .populate('items.product', 'name slug images brand isPrescriptionRequired')
        .lean(),
      Prescription.find({ user: user._id })
        .populate('requestedProduct', 'name brand slug images')
        .sort({ uploadedAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const activeOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status));
    const deliveredOrders = orders.filter((order) => order.status === 'delivered');
    const cancelledOrders = orders.filter((order) => order.status === 'cancelled');
    const cartItems = cart?.items || [];
    const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({
      success: true,
      user,
      orders,
      activeOrders,
      cart: cart ? {
        ...cart,
        subtotal: cartSubtotal,
        itemCount: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      } : null,
      prescriptions,
      summary: {
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalSpent: deliveredOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
        prescriptionCount: prescriptions.length,
        cartItemCount: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User status updated', user });
  } catch (error) {
    next(error);
  }
};

export const updateUserAdminNotes = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { adminNotes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { adminNotes: adminNotes || '' },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Admin notes updated', user });
  } catch (error) {
    next(error);
  }
};
