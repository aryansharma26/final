import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useRef, useState } from "react";

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
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const tapTimeoutRef = useRef(null);

  const handleCardClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => {
        onCardClick?.(product);
      }, 120);
      return;
    }
    onCardClick?.(product);
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (product.isPrescriptionRequired) {
      navigate(
        isAuthenticated
          ? `/product/${product.slug}`
          : `/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`,
        isAuthenticated ? undefined : { state: { from: location } },
      );
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
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const cardClasses =
    "pressable group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg active:shadow-lg transition-shadow cursor-pointer min-w-0";

  const cardProps = {
    onClick: handleCardClick,
    onKeyDown: handleKeyDown,
    role: "button",
    tabIndex: 0,
    "aria-label": `View ${product.name}`,
    className: cardClasses,
  };

  const imageSection = (
    <div className="relative aspect-square bg-gray-50 overflow-hidden">
      <img
        src={
          product.images?.[0] ||
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop"
        }
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-105"
      />
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-pills-pink text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md sm:top-3 sm:left-3 sm:text-xs sm:px-2 sm:py-1">
          -
          {Math.round(
            ((product.price - product.discountPrice) / product.price) * 100,
          )}
          %
        </div>
      )}
      {showHeart && (
        <motion.button
          onClick={handleHeartClick}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          className="pressable absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-100 transition-opacity hover:bg-red-50 sm:top-3 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </motion.button>
      )}
    </div>
  );

  const infoSection = (
    <div className="p-2.5 sm:p-3 lg:p-4">
      <p className="truncate text-[11px] font-medium text-gray-500 sm:text-xs mb-1">
        {product.brand}
      </p>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 min-h-[2.35rem] hover:text-brand group-active:text-brand sm:mb-2 sm:min-h-[2.5rem]">
        {product.name}
      </h3>

      {showRating && (
        <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
          <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
            <span className="text-xs font-semibold text-green-700">
              {product.rating || 0}
            </span>
            <Star className="w-3 h-3 text-green-600 fill-green-600" />
          </div>
          <span className="text-xs text-gray-400">
            ({product.numReviews || 0})
          </span>
        </div>
      )}

      {stackedActions ? (
        <>
          <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through sm:text-sm">
                ₱{product.price}
              </span>
            )}
            <span className="text-[15px] font-bold text-gray-900 sm:text-lg">
              ₱
              {product.discountPrice > 0
                ? product.discountPrice
                : product.price}
            </span>
            {hasDiscount && (
              <span className="text-[11px] font-bold text-pills-pink bg-pills-pink/10 px-1.5 py-0.5 rounded sm:text-xs">
                {Math.round(
                  ((product.price - product.discountPrice) / product.price) *
                    100,
                )}
                % off
              </span>
            )}
            <span className="text-[10px] text-gray-400 block font-normal w-full">
              Inclusive of Tax
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleActionClick}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              className="pressable flex-1 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {actionIcon || <ShoppingCart className="w-4 h-4" />}
              {actionLabel}
            </motion.button>
            {showRemoveButton && onRemoveClick && (
              <button
                onClick={handleRemoveClick}
                className="pressable p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
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
              <span className="text-xs text-gray-400 line-through sm:text-sm">
                ₱{product.price}
              </span>
            )}
            <span className="text-base font-bold text-gray-900 sm:text-lg">
              ₱
              {product.discountPrice > 0
                ? product.discountPrice
                : product.price}
            </span>
            {hasDiscount && (
              <span className="hidden text-xs font-bold text-pills-pink bg-pills-pink/10 px-1.5 py-0.5 rounded sm:inline">
                {Math.round(
                  ((product.price - product.discountPrice) / product.price) *
                    100,
                )}
                % off
              </span>
            )}
            <span className="text-[10px] text-gray-400 block font-normal w-full">
              Inclusive of Tax
            </span>
          </div>

          {onActionClick ? (
            <div className="flex items-center gap-2 flex-1 ml-3">
              <motion.button
                onClick={handleActionClick}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.97 }}
                className="pressable flex-1 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {actionIcon || <ShoppingCart className="w-4 h-4" />}
                {actionLabel}
              </motion.button>
              {showRemoveButton && onRemoveClick && (
                <button
                  onClick={handleRemoveClick}
                  className="pressable p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : onCartClick ? (
            <motion.button
              onClick={handleCartClick}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              className="pressable w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-brand/10 hover:bg-brand text-brand hover:text-white sm:h-8 sm:w-8"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 10 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      whileHover={{ y: -6 }}
      whileTap={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}

      // initial={animated ? { opacity: 0, y: 15 } : undefined}
      // whileInView={
      //   animated
      //     ? {
      //         opacity: 1,
      //         y: 0,
      //         transition: {
      //           duration: 0.35,
      //           delay: index * 0.05,
      //           ease: "easeOut",
      //         },
      //       }
      //     : undefined
      // }
      // viewport={{ once: true }}
      // whileHover={{
      //   y: -6,
      //   scale: 1.015,
      //   transition: {
      //     duration: 0.2,
      //     ease: "easeInOut",
      //   },
      // }}

      // initial={animated ? { opacity: 0, y: 10 } : undefined}
      // animate={animated ? { opacity: 1, y: 0 } : undefined}
      // whileHover={{
      //   y: -6,
      //   scale: 1.015,
      // }}
      // transition={{
      //   type: "spring",
      //   stiffness: 500,
      //   damping: 10,
      // }}
      {...cardProps}
    >
      {imageSection}
      {infoSection}
    </motion.div>
  );
};

export default ProductCard;
