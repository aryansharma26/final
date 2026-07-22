import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, Star, Minus, Plus, Truck, Shield, CheckCircle, CreditCard, Info, ListChecks, HelpCircle, FileText, Upload, Loader2, XCircle, Tag, Camera } from 'lucide-react';
import { productAPI, reviewAPI, wishlistAPI, prescriptionAPI } from '../api/index.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { compressPrescriptionFile } from '../utils/prescriptionFiles.js';

const getCachedProduct = (slugKey) => {
  if (typeof window === 'undefined' || !slugKey) return null;
  try {
    return JSON.parse(sessionStorage.getItem(`pd-cache-${slugKey}`) || 'null');
  } catch {
    return null;
  }
};

const setCachedProduct = (slugKey, prod) => {
  if (typeof window === 'undefined' || !slugKey || !prod) return;
  try {
    sessionStorage.setItem(`pd-cache-${slugKey}`, JSON.stringify(prod));
  } catch {}
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const initialProd = location.state?.product || getCachedProduct(slug);
  const [product, setProduct] = useState(() => initialProd || null);
  const [reviews, setReviews] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(() => !initialProd);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [addError, setAddError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewSubmitError, setReviewSubmitError] = useState('');

  const [rxStatus, setRxStatus] = useState('none');
  const [rxPrescription, setRxPrescription] = useState(null);
  const [rxStatusLoading, setRxStatusLoading] = useState(false);
  const [rxUploadingSource, setRxUploadingSource] = useState('');
  const [rxError, setRxError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    setSelectedImage(0);
    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (product) {
      if (isAuthenticated) {
        checkWishlist();
        checkPrescriptionStatus(product._id);
      } else {
        setRxStatus('none');
        setRxPrescription(null);
      }
    }
  }, [product, isAuthenticated]);

  const loadProduct = async () => {
    try {
      if (!product) setLoading(true);
      const { data } = await productAPI.getProductBySlug(slug);
      if (data?.product) {
        setProduct(data.product);
        setCachedProduct(slug, data.product);
      }
      setSimilarProducts(data?.similarProducts || []);
      if (data?.product) {
        loadReviews(data.product._id);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (productId) => {
    if (!productId) return;
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const { data } = await reviewAPI.getProductReviews(productId);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviewsError(err?.response?.data?.message || err.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkWishlist = async () => {
    try {
      const { data } = await wishlistAPI.getWishlist();
      const wishlistProductIds = data.wishlist?.products?.map((p) => p._id || p) || [];
      setIsWishlisted(wishlistProductIds.includes(product._id));
    } catch (err) {
      console.error('Failed to check wishlist:', err);
    }
  };

  const checkPrescriptionStatus = async (productId) => {
    if (!productId || !isAuthenticated) return;
    try {
      const cached = JSON.parse(localStorage.getItem(`rxStatus:${productId}`) || 'null');
      if (cached?.status) {
        setRxStatus(cached.status);
        setRxPrescription(cached.prescription || null);
      }
      setRxStatusLoading(true);
      setRxError('');
      const { data } = await prescriptionAPI.getPrescriptionStatus({ productId });
      const latest = data.latestPrescription || null;
      setRxPrescription(latest);
      setRxStatus(latest?.status || 'none');
      localStorage.setItem(`rxStatus:${productId}`, JSON.stringify({ status: latest?.status || 'none', prescription: latest }));
    } catch (err) {
      setRxError(err?.response?.data?.message || 'Could not check prescription status');
      setRxStatus('none');
      setRxPrescription(null);
      localStorage.removeItem(`rxStatus:${productId}`);
    } finally {
      setRxStatusLoading(false);
    }
  };

  const handleGoBack = () => {
    if (location.state?.from) {
      navigate(-1);
    } else {
      navigate('/medicines', { replace: true });
    }
  };

  const goToLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(`/product/${slug}`)}`, {
      state: { from: location },
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddError('');
    const result = await addToCart(product, quantity);
    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAddError(result?.message || 'Failed to add to cart');
      if (result?.requiresPrescription) {
        setTimeout(() => setAddError(''), 5000);
      } else {
        setTimeout(() => setAddError(''), 3000);
      }
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setBuyingNow(true);
    setAddError('');
    try {
      let price = product.discountPrice > 0 ? product.discountPrice : product.price;
      if (product.bulkPricing && product.bulkPricing.length > 0) {
        const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
        const matchingTier = sortedTiers.find(tier => quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty));
        if (matchingTier) {
          price = matchingTier.unitPrice;
        }
      }

      const buyNowItem = {
        productId: product._id,
        name: product.name,
        image: product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || '',
        slug: product.slug,
        quantity,
        price,
        taxRate: product.taxRate,
      };

      sessionStorage.setItem('pendingBuyNowCheckout', JSON.stringify(buyNowItem));
      navigate('/checkout', {
        state: {
          fromBuyNow: true,
          buyNowItem,
        },
      });
    } catch (err) {
      setAddError(err.message || 'Failed to proceed to checkout');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    if (!product) return;
    try {
      setWishlistLoading(true);
      if (isWishlisted) {
        await wishlistAPI.removeFromWishlist(product._id);
        setIsWishlisted(false);
      } else {
        await wishlistAPI.addToWishlist({ productId: product._id });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const onSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    if (!reviewRating) {
      setReviewSubmitError('Please select a rating');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewSubmitError('Please write a review');
      return;
    }
    try {
      setReviewSubmitting(true);
      setReviewSubmitError('');
      await reviewAPI.createReview({ product: product._id, rating: reviewRating, comment: reviewComment.trim() });
      setReviewRating(0);
      setReviewComment('');
      setReviewMessage('Thanks, your review has been added.');
      await loadProduct();
      setTimeout(() => setReviewMessage(''), 3000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewSubmitError(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRxFileChange = async (e) => {
    const file = e.target.files?.[0];
    const source = e.target === cameraInputRef.current ? 'camera' : 'file';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setRxError('Only JPG, PNG, PDF allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setRxError('File must be under 10MB');
      return;
    }

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    setRxError('');
    setRxUploadingSource(source);
    try {
      const uploadReadyFile = await compressPrescriptionFile(file);
      if (uploadReadyFile.size > 10 * 1024 * 1024) {
        setRxError('File must be under 10MB');
        return;
      }
      const formData = new FormData();
      formData.append('prescription', uploadReadyFile);
      formData.append('productId', product._id);
      const { data } = await prescriptionAPI.uploadPrescription(formData);
      const uploadedPrescription = data.prescription || null;
      setRxPrescription(uploadedPrescription);
      setRxStatus('pending');
      localStorage.setItem(`rxStatus:${product._id}`, JSON.stringify({ status: 'pending', prescription: uploadedPrescription }));
    } catch (err) {
      setRxError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setRxUploadingSource('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  if (loading && !product) {
    return <div className="min-h-[75vh] bg-white" />;
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="text-gray-500">Product not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-brand font-medium hover:underline mt-4 inline-block"
        >
          Back
        </button>
      </div>
    );
  }

  const discount = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const averageRating = Number(product.rating || 0);
  const reviewCount = Number(product.numReviews || reviews.length || 0);
  const categoryName = product.category?.name || product.category?.parent?.name || 'Medicine';
  const stockLabel = product.stock > 0 ? 'In stock' : 'Out of stock';
  const ratingBreakdown = [5, 4, 3, 2, 1].map((ratingValue) => {
    const count = reviews.filter((review) => Number(review.rating) === ratingValue).length;
    return {
      rating: ratingValue,
      count,
      percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
    };
  });
  const hasProductDetails = Boolean(
    product.productInfo ||
    product.keyIngredients?.length ||
    product.otherIngredients?.length ||
    product.goodToKnow ||
    product.productForm ||
    product.netQty ||
    product.directionsForUse ||
    product.safetyInfo?.length ||
    product.quickTips?.length ||
    product.faqs?.length
  );
  const detailStats = [
    product.productForm ? { label: 'Product Form', value: product.productForm } : null,
    product.netQty ? { label: 'Net Qty', value: product.netQty } : null,
  ].filter(Boolean);

  const renderList = (items) => (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-relaxed text-gray-600">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-none text-green-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  const isRxRequired = product?.isPrescriptionRequired;
  const canPurchase = !isRxRequired || ['pending', 'approved'].includes(rxStatus);
  const rxUploaded = canPurchase;
  const rxRejected = rxStatus === 'rejected';
  const rxUploading = Boolean(rxUploadingSource);

  return (
    <div className="container-custom py-3 lg:py-5">
      <button
        onClick={handleGoBack}
        className="pressable inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </button>

      <div className="mt-3 grid grid-cols-12 gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-4 lg:gap-5 lg:p-5">
        {/* ─── Images: 45% ─── */}
        <div className="col-span-12 space-y-3 lg:col-span-5">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-2 sm:rounded-3xl sm:p-3">
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-white sm:min-h-[340px] lg:min-h-[500px]">
              <img
                src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop'}
                alt={product.name}
                className="h-full max-h-[500px] w-full object-contain p-2"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-14 w-14 overflow-hidden rounded-xl border-2 bg-white p-1 shadow-sm transition-colors ${selectedImage === i ? 'border-brand' : 'border-gray-200 hover:border-brand/40'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Rating</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-lg font-bold text-gray-950">{averageRating.toFixed(1)}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="mt-0.5 text-xs text-gray-400">{reviewCount} reviews</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Availability</p>
              <p className={`mt-1 text-sm font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>{stockLabel}</p>
              <p className="mt-0.5 text-xs text-gray-400">{product.status || 'active'}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Category</p>
              <p className="mt-1 text-sm font-semibold text-gray-950">{categoryName}</p>
              <p className="mt-0.5 text-xs text-gray-400">{product.productForm || 'Healthcare'}</p>
            </div>
          </div>
        </div>

        {/* ─── Info: 55% ─── */}
        <div className="col-span-12 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/70 p-3 sm:rounded-3xl sm:p-4 lg:col-span-7 lg:p-5">
          <div>
            <p className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{product.brand}</p>
            <h1 className="mt-2 text-xl font-bold leading-snug text-gray-950 sm:text-2xl lg:text-3xl">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5 rounded-full bg-green-50 px-2.5 py-1">
              <span className="text-sm font-semibold text-green-700">{averageRating.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
            </div>
            <span className="text-sm text-gray-400">({reviewCount} reviews)</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">₱{product.discountPrice > 0 ? product.discountPrice : product.price}</span>
              {product.discountPrice > 0 && (
                <>
                  <span className="text-base text-gray-400 line-through">₱{product.price}</span>
                  <span className="rounded bg-pills-pink/10 px-2 py-0.5 text-xs font-bold text-pills-pink">{discount}% OFF</span>
                </>
              )}
              <span className="text-xs text-gray-400 block w-full font-normal">Inclusive of Tax</span>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">{product.description}</p>

          {product.benefits?.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold text-sm text-gray-900 mb-1.5">Key Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {product.benefits.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(product.composition || product.dosage) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {product.composition && (
                <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-0.5">Composition</h3>
                  <p className="text-xs text-gray-600">{product.composition}</p>
                </div>
              )}
              {product.dosage && (
                <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-0.5">Dosage</h3>
                  <p className="text-xs text-gray-600">{product.dosage}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Bulk Pricing Section ─── */}
          {product.bulkPricing?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-sm text-green-900">Bulk / Group Offers</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.bulkPricing.map((tier, i) => (
                  <div key={i} className="rounded-xl bg-white border border-green-200 p-3 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">{tier.label || `${tier.minQty}${tier.maxQty ? `-${tier.maxQty}` : '+'} pcs`}</p>
                    <p className="text-lg font-bold text-green-700">₱{tier.unitPrice}</p>
                    <p className="text-[10px] text-gray-400">per unit</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Prescription Section ─── */}
          {isRxRequired && (
            <div className={`mt-4 rounded-xl border p-3 ${rxStatus === 'rejected' ? 'border-red-200 bg-red-50/60' : canPurchase ? 'border-green-200 bg-green-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${rxStatus === 'rejected' ? 'bg-red-100' : canPurchase ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {rxStatus === 'rejected' ? <XCircle className="h-3.5 w-3.5 text-red-600" /> : <FileText className={`h-3.5 w-3.5 ${canPurchase ? 'text-green-600' : 'text-amber-600'}`} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${rxStatus === 'rejected' ? 'text-red-800' : canPurchase ? 'text-green-800' : 'text-amber-800'}`}>
                    {rxRejected ? 'Prescription Rejected' : rxUploaded ? 'Prescription Uploaded' : 'Prescription Required'}
                  </p>
                  {rxUploaded ? (
                    <p className="mt-0.5 text-xs text-green-700">You can purchase this medicine now.</p>
                  ) : (
                    <>
                      <p className={`mt-0.5 text-xs ${rxRejected ? 'text-red-700' : 'text-amber-700'}`}>
                        {rxRejected ? 'Rejected. Upload a correct prescription again.' : 'Upload a prescription to unlock purchase.'}
                        {!rxRejected && !isAuthenticated && ' Please log in to upload your prescription.'}
                      </p>
                      {rxRejected && rxPrescription?.adminNotes && (
                        <p className="mt-1 text-xs font-medium text-red-700">Reason: {rxPrescription.adminNotes}</p>
                      )}

                    </>
                  )}
                  {isAuthenticated && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleRxFileChange}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleRxFileChange}
                        className="hidden"
                      />
                    </>
                  )}
                  {rxError && <p className="mt-2 text-sm text-red-600">{rxError}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Quantity</p>
                  <div className="mt-1 inline-flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors hover:text-brand"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-bold text-gray-950">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors hover:text-brand"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors ${isWishlisted ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-red-200 hover:bg-red-50'}`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </button>
              </div>

              <div className="grid flex-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {!canPurchase ? (
                  !isAuthenticated ? (
                    <button
                      onClick={goToLogin}
                      disabled={rxUploading}
                      className="pressable col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {rxUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Log in to Upload Prescription
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={rxUploading}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gray-950 py-3.5 text-sm font-semibold text-white shadow-lg shadow-gray-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {rxUploadingSource === 'camera' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={rxUploading}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {rxUploadingSource === 'file' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {rxRejected ? 'Upload Again' : 'Choose File'}
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className={`pressable flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${
                        added ? 'bg-green-500 text-white shadow-green-500/25' : addError ? 'bg-red-500 text-white shadow-red-500/25' : 'bg-brand hover:bg-brand-dark text-white shadow-brand/25'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {added ? 'Added!' : addError ? 'Failed' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => window.setTimeout(handleBuyNow, 160)}
                      disabled={buyingNow}
                      className="pressable buy-now-pressable flex items-center justify-center gap-2 rounded-2xl bg-gray-950 py-3.5 text-sm font-semibold text-white shadow-lg shadow-gray-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      {buyingNow ? 'Processing...' : 'Buy Now'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {addError && (
            <p className="mt-2 text-sm text-red-600">{addError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2">
              <Truck className="w-4 h-4 text-brand" />
              <span>Free delivery above ₱2000</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2">
              <Shield className="w-4 h-4 text-brand" />
              <span>100% Genuine</span>
            </div>
          </div>
        </div>
      </div>

      {hasProductDetails && (
        <div className="mt-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_14px_50px_rgba(15,23,42,0.05)] lg:p-5">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-bold text-gray-950">Product Information</h2>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {product.productInfo && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Overview</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{product.productInfo}</p>
                </div>
              )}

              {product.keyIngredients?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Key Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.keyIngredients.map((ingredient, index) => (
                      <span key={`${ingredient}-${index}`} className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-gray-700">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.otherIngredients?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Other Ingredients</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{product.otherIngredients.join(', ')}</p>
                </div>
              )}

              {product.goodToKnow && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <h3 className="mb-1 text-sm font-semibold text-green-900">Good to Know</h3>
                  <p className="text-sm leading-relaxed text-green-800">{product.goodToKnow}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 lg:col-span-4">
              {detailStats.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {detailStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-950">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {product.directionsForUse && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <ListChecks className="h-4 w-4 text-brand" /> Directions for Use
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">{product.directionsForUse}</p>
                </div>
              )}
            </div>
          </div>

          {(product.safetyInfo?.length > 0 || product.quickTips?.length > 0) && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {product.safetyInfo?.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Safety Information</h3>
                  {renderList(product.safetyInfo)}
                </div>
              )}
              {product.quickTips?.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Quick Tips</h3>
                  {renderList(product.quickTips)}
                </div>
              )}
            </div>
          )}

          {product.faqs?.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <HelpCircle className="h-4 w-4 text-brand" /> Frequently Asked Questions
              </h3>
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
                {product.faqs.map((faq, index) => (
                  <div key={`${faq.question}-${index}`} className="p-4">
                    <p className="text-sm font-semibold text-gray-950">Q. {faq.question}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {similarProducts.length > 0 && (
        <div className="mt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-950">Similar Products</h2>
            <button
              onClick={() => navigate('/medicines')}
              className="text-sm font-medium text-brand hover:text-brand-dark"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {similarProducts.map((similarProduct) => (
              <ProductCard
                key={similarProduct._id}
                product={similarProduct}
                animated={false}
                onCardClick={() => navigate(`/product/${similarProduct.slug}`, {
                  state: { from: location.state?.from || { pathname: '/medicines', search: '' } },
                })}
                onCartClick={() => addToCart(similarProduct, 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Reviews ─── */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_14px_50px_rgba(15,23,42,0.05)] sm:rounded-3xl sm:p-4 lg:p-5">
        <h2 className="mb-3 text-lg font-bold text-gray-950 sm:mb-4 sm:text-xl">Customer Reviews</h2>
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-5">
              <div className="mb-4 rounded-2xl bg-white p-3 sm:mb-5 sm:p-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{averageRating.toFixed(1)}</span>
                  <span className="pb-1 text-sm text-gray-500">out of 5</span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">{reviewCount} customer reviews</p>
                <div className="mt-3 space-y-1.5 sm:mt-4">
                  {ratingBreakdown.map((row) => (
                    <div key={row.rating} className="grid grid-cols-[28px_1fr_34px] items-center gap-2 text-xs text-gray-500">
                      <span>{row.rating}★</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-yellow-400" style={{ width: `${row.percentage}%` }} />
                      </div>
                      <span className="text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="mb-3 text-sm font-semibold text-gray-900">Write a Review</h3>
            
              <form onSubmit={onSubmitReview} className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          className="rounded-lg p-0.5 transition-colors hover:bg-yellow-50 sm:p-1"
                          aria-label={`${value} star rating`}
                        >
                          <Star className={`h-6 w-6 sm:h-7 sm:w-7 ${value <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{reviewRating ? `${reviewRating} star${reviewRating > 1 ? 's' : ''} selected` : 'Tap stars to rate'}</p>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Your review..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {reviewMessage && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{reviewMessage}</p>}
                {reviewSubmitError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{reviewSubmitError}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="pressable w-full py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand/20 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
          <div className="col-span-12 space-y-3 lg:col-span-8">
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-3 animate-pulse sm:p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : reviewsError ? (
              <div className="bg-red-50 rounded-xl p-5 text-center">
                <p className="text-red-600 text-sm mb-3">{reviewsError}</p>
                <button
                  onClick={() => product && loadReviews(product._id)}
                  className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                  <div className="mb-2 flex flex-col gap-2 sm:mb-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 sm:h-7 sm:w-7">
                        <span className="text-brand font-bold text-xs">{(review.name || review.user?.name)?.[0] || 'U'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-900">{review.name || review.user?.name || 'Customer'}</span>
                        {review.isVerifiedPurchase && <p className="text-xs text-green-600">Verified purchase</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 pl-10 sm:pl-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
