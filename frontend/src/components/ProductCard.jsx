import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * ProductCard
 * -----------
 * Reusable product card component used across all product listing pages.
 * Full card is clickable for navigation. Inner buttons (cart, heart, remove)
 * use stopPropagation() so they don't trigger card navigation.
 *
 * Props:
 *   product           – product object (required)
 *   index             – animation stagger index (default 0)
 *   onCardClick       – fn(product) – triggers on full card click
 *   showHeart         – show heart overlay on image (default false)
 *   onHeartClick      – fn(product) – heart button click
 *   onCartClick       – fn(product) – round cart icon click
 *   onActionClick     – fn(product) – full-width action button click
 *   actionLabel       – text for the full-width action button
 *   actionIcon        – ReactNode for the action button icon
 *   showRemoveButton  – show trash icon next to action button (default false)
 *   onRemoveClick     – fn(product) – trash button click
 *   showRating        – show rating row (default true)
 *   animated          – use framer-motion entrance animation (default true)
 *   stackedActions    – render action buttons below price instead of inline (default false)
 */

const ProductCard = ({
  product,
  index = 0,
  onCardClick,
  showHeart = false,
  onHeartClick,
  onCartClick,
  onActionClick,
  actionLabel,
  actionIcon,
  showRemoveButton = false,
  onRemoveClick,
  showRating = true,
  animated = true,
  stackedActions = false,
}) => {
  const hasDiscount = product.discountPrice > 0;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCardClick = () => {
    onCardClick?.(product);
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (product.isPrescriptionRequired) {
      navigate(isAuthenticated ? `/product/${product.slug}` : `/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    onCartClick?.(product);
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    onHeartClick?.(product);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    onActionClick?.(product);
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemoveClick?.(product);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const cardClasses = 'group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer min-w-0';

  const cardProps = {
    onClick: handleCardClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0,
    'aria-label': `View ${product.name}`,
    className: cardClasses,
  };

  const imageSection = (
    <div className="relative aspect-square bg-gray-50 overflow-hidden">
      <img
        src={product.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {hasDiscount && (
        <div className="absolute top-3 left-3 bg-pills-pink text-white text-xs font-bold px-2 py-1 rounded-md">
          -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
        </div>
      )}
      {showHeart && (
        <button
          onClick={handleHeartClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-100 transition-opacity hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      )}
    </div>
  );

  const infoSection = (
    <div className="p-2.5 sm:p-3 lg:p-4">
      <p className="truncate text-[11px] font-medium text-gray-500 sm:text-xs mb-1">{product.brand}</p>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] hover:text-brand">
        {product.name}
      </h3>

      {showRating && (
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
            <span className="text-xs font-semibold text-green-700">{product.rating || 0}</span>
            <Star className="w-3 h-3 text-green-600 fill-green-600" />
          </div>
          <span className="text-xs text-gray-400">({product.numReviews || 0})</span>
        </div>
      )}

      {stackedActions ? (
        <>
          <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through sm:text-sm">₱{product.price}</span>
            )}
            <span className="text-base font-bold text-gray-900 sm:text-lg">
              ₱{product.discountPrice > 0 ? product.discountPrice : product.price}
            </span>
            {hasDiscount && (
              <span className="text-[11px] font-bold text-pills-pink bg-pills-pink/10 px-1.5 py-0.5 rounded sm:text-xs">
                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
              </span>
            )}
            <span className="text-[10px] text-gray-400 block font-normal w-full">Inclusive of Tax</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleActionClick}
              className="flex-1 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {actionIcon || <ShoppingCart className="w-4 h-4" />}
              {actionLabel}
            </button>
            {showRemoveButton && onRemoveClick && (
              <button
                onClick={handleRemoveClick}
                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through sm:text-sm">₱{product.price}</span>
            )}
            <span className="text-base font-bold text-gray-900 sm:text-lg">
              ₱{product.discountPrice > 0 ? product.discountPrice : product.price}
            </span>
            {hasDiscount && (
              <span className="hidden text-xs font-bold text-pills-pink bg-pills-pink/10 px-1.5 py-0.5 rounded sm:inline">
                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
              </span>
            )}
            <span className="text-[10px] text-gray-400 block font-normal w-full">Inclusive of Tax</span>
          </div>

          {onActionClick ? (
            <div className="flex items-center gap-2 flex-1 ml-3">
              <button
                onClick={handleActionClick}
                className="flex-1 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {actionIcon || <ShoppingCart className="w-4 h-4" />}
                {actionLabel}
              </button>
              {showRemoveButton && onRemoveClick && (
                <button
                  onClick={handleRemoveClick}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : onCartClick ? (
            <button
              onClick={handleCartClick}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-brand/10 hover:bg-brand text-brand hover:text-white"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  if (!animated) {
    return (
      <div {...cardProps}>
        {imageSection}
        {infoSection}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...cardProps}
    >
      {imageSection}
      {infoSection}
    </motion.div>
  );
};

export default ProductCard;
