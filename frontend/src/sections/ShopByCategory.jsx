import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate, useNavigationType } from "react-router-dom";
import { categoryAPI } from "../api/index.js";

const MotionLink = motion(Link);

const CATEGORY_STYLES = {
  "Cancer Care": {
    emoji: "🎗️",
    bg: "bg-indigo-50 border-indigo-100/50",
  },
  "Skin Care": {
    emoji: "🧴",
    bg: "bg-pink-50 border-pink-100/50",
  },
  "Dental Care": {
    emoji: "🦷",
    bg: "bg-sky-50 border-sky-100/50",
  },
  Wellness: {
    emoji: "🌿",
    bg: "bg-teal-50 border-teal-100/50",
  },
  "Reproductive Care": {
    emoji: "🌸",
    bg: "bg-rose-50 border-rose-100/50",
  },
  "Heart Care": {
    emoji: "❤️",
    bg: "bg-red-50 border-red-100/50",
  },
  Nutrition: {
    emoji: "🍎",
    bg: "bg-amber-50 border-amber-100/50",
  },
  Fitness: {
    emoji: "💪",
    bg: "bg-slate-50 border-slate-100/50",
  },
  Diabetes: {
    emoji: "💉",
    bg: "bg-emerald-50 border-emerald-100/50",
  },
  "Pet Care": {
    emoji: "🐶",
    bg: "bg-orange-50 border-orange-100/50",
  },
};

const FALLBACK_STYLE = {
  emoji: "📦",
  bg: "bg-brand/5 border-brand/10",
};

const CategoryIllustration = ({ categoryName, active = false }) => {
  const style = CATEGORY_STYLES[categoryName] || FALLBACK_STYLE;

  return (
    <div
      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${style.bg}`}
    >
      <span className={`select-none text-2xl leading-none transition-transform duration-300 group-hover:scale-110 ${active ? "scale-110" : ""}`}>
        {style.emoji}
      </span>
    </div>
  );
};

const CATEGORY_CACHE_KEY = "shop-by-category-cache";
const CATEGORY_RESTORE_KEY = "shop-by-category-restore";

const getCachedCategories = () => {
  if (typeof window === "undefined") return [];
  try {
    const cached = JSON.parse(sessionStorage.getItem(CATEGORY_CACHE_KEY) || "[]");
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
};

const setCachedCategories = (categories) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(categories));
  } catch {}
};

const saveCategoryRestoreTarget = (categoryId, element) => {
  if (typeof window === "undefined" || !element) return;
  try {
    const rect = element.getBoundingClientRect();
    sessionStorage.setItem(
      CATEGORY_RESTORE_KEY,
      JSON.stringify({
        categoryId,
        viewportTop: rect.top,
      })
    );
  } catch {}
};

const ShopByCategory = () => {
  const [categories, setCategories] = useState(getCachedCategories);
  const [loading, setLoading] = useState(getCachedCategories().length === 0);
  const [error, setError] = useState(null);
  const [pressedCategoryId, setPressedCategoryId] = useState(null);
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const tapTimeoutRef = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      setPressedCategoryId(null);
    };
  }, []);

  // Element Target Anchoring for Back Navigation Restoration
  useEffect(() => {
    if (navigationType !== "POP" || categories.length === 0) return;

    const restoreCategoryPosition = () => {
      try {
        const targetData = JSON.parse(sessionStorage.getItem(CATEGORY_RESTORE_KEY) || "null");
        if (!targetData || !targetData.categoryId) return;

        const element = document.querySelector(`[data-category-id="${targetData.categoryId}"]`);
        if (element) {
          const currentRect = element.getBoundingClientRect();
          const targetTop = Number(targetData.viewportTop ?? 180);
          const diff = currentRect.top - targetTop;
          if (Math.abs(diff) > 2) {
            window.scrollBy(0, diff);
          }
          sessionStorage.removeItem(CATEGORY_RESTORE_KEY);
        }
      } catch {}
    };

    requestAnimationFrame(restoreCategoryPosition);
    const timer1 = setTimeout(restoreCategoryPosition, 50);
    const timer2 = setTimeout(restoreCategoryPosition, 180);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [navigationType, categories.length]);

  const loadCategories = async () => {
    try {
      if (categories.length === 0) setLoading(true);
      setError(null);
      const { data } = await categoryAPI.getCategories();
      const allCats = data?.categories || [];
      // Only parent categories (no parent field -> null or missing)
      const parentCats = allCats.filter((c) => !c.parent);
      setCategories(parentCats);
      setCachedCategories(parentCats);
    } catch (err) {
      console.error("[ShopByCategory] Failed to load:", err);
      if (categories.length === 0) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load categories",
        );
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (e, categoryId) => {
    saveCategoryRestoreTarget(categoryId, e.currentTarget);
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
      e.preventDefault();
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      setPressedCategoryId(categoryId);
      tapTimeoutRef.current = setTimeout(() => {
        navigate(`/medicines?category=${categoryId}`);
      }, 320);
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-7 sm:py-10 lg:py-14">
        <div className="container-custom">
          <div className="mb-5 sm:mb-7 flex items-end justify-between">
            <div>
              <div className="mb-3 h-4 w-24 animate-pulse rounded-full bg-gray-200" />
              <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
            </div>
            <div className="hidden h-5 w-16 animate-pulse rounded-full bg-gray-200 sm:block" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 h-16 w-16 animate-pulse rounded-2xl bg-gray-200" />
                <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white py-7 sm:py-10 lg:py-14">
        <div className="container-custom text-center">
          <p className="mb-3 text-sm font-medium text-red-500">{error}</p>
          <button
            onClick={loadCategories}
            className="pressable rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="bg-white py-7 sm:py-10 lg:py-14">
        <div className="container-custom text-center">
          <p className="text-gray-500">No categories available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-7 sm:py-10 lg:py-14">
      <div className="container-custom">
        <div className="mb-5 sm:mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pills-pink-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-pills-pink-dark">
              <Sparkles className="h-3 w-3" />
              Curated care
            </div>
            <h2 className="text-2xl font-bold text-gray-950 lg:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Quickly browse trusted health essentials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category, index) => {
            const count = category.productCount || 0;
            const isPressed = pressedCategoryId === category._id;

            return (
              <MotionLink
                key={category._id}
                data-category-id={category._id}
                to={`/medicines?category=${category._id}`}
                onClick={(e) => handleCategoryClick(e, category._id)}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.35,
                    delay: (index % 6) * 0.05,
                    ease: "easeOut",
                  },
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 10,
                  },
                }}
                animate={
                  isPressed
                    ? {
                        opacity: 1,
                        y: -6,
                        scale: 1.02,
                        transition: {
                          type: "spring",
                          stiffness: 500,
                          damping: 10,
                        },
                      }
                    : undefined
                }
                whileTap={{
                  y: -6,
                  scale: 1.02,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 10,
                  },
                }}
                className={`pressable group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-colors hover:border-brand/25 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:p-4 ${
                  isPressed ? "shadow-lg" : ""
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-pills-pink/60 opacity-0 transition-opacity sm:group-hover:opacity-100" />
                <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                  <CategoryIllustration categoryName={category.name} active={isPressed} />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors sm:group-hover:bg-brand sm:group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-gray-950">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {count} {count === 1 ? "Product" : "Products"}
                </p>
              </MotionLink>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
