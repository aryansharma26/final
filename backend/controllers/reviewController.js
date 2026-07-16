import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export const createReview = async (req, res, next) => {
  try {
    const { product, rating, comment } = req.body;
    const productDoc = await Product.findById(product).select('_id');
    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const existingReview = await Review.findOne({ user: req.user._id, product });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }
    const normalizedRating = Number(rating);
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ success: false, message: 'Please select a rating between 1 and 5' });
    }
    if (!String(comment || '').trim()) {
      return res.status(400).json({ success: false, message: 'Please write a review' });
    }
    const hasPurchased = await Order.exists({ user: req.user._id, status: 'delivered', 'orderItems.product': product });
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You can review this product after your delivered purchase.',
      });
    }
    const review = await Review.create({
      user: req.user._id,
      product,
      name: req.user.name,
      rating: normalizedRating,
      comment: String(comment).trim(),
      isVerifiedPurchase: true,
    });
    const reviews = await Review.find({ product, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(product, { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length });
    res.status(201).json({ success: true, message: 'Review submitted', review });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { rating, comment },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    const reviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(review.product, { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length });
    res.json({ success: true, message: 'Review updated', review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    const reviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(review.product, { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    const reviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(review.product, { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    let page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const total = await Review.countDocuments();
    const pages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, pages);
    const skip = (page - 1) * limit;
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, count: reviews.length, total, pagination: { page, limit, pages }, reviews });
  } catch (error) {
    next(error);
  }
};

export const toggleReviewApproval = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    review.isApproved = !review.isApproved;
    await review.save();
    const reviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(review.product, { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length });
    res.json({ success: true, message: 'Review approval toggled', review });
  } catch (error) {
    next(error);
  }
};
