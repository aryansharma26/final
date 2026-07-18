import { useState, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  Bone,
  Dumbbell,
  HeartPulse,
  PawPrint,
  Pill,
  ShieldPlus,
  Sparkles,
  Syringe,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { categoryAPI } from "../api/index.js";

const CATEGORY_STYLES = {
  "Cancer Care": {
    icon: ShieldPlus,
  },
  "Skin Care": {
    icon: Sparkles,
  },
  "Dental Care": {
    icon: Bone,
  },
  Wellness: {
    icon: UserRound,
  },
  "Reproductive Care": {
    icon: Activity,
  },
  "Heart Care": {
    icon: HeartPulse,
  },
  Nutrition: {
    icon: Pill,
  },
  Fitness: {
    icon: Dumbbell,
  },
  Diabetes: {
    icon: Syringe,
  },
  "Pet Care": {
    icon: PawPrint,
  },
};

const FALLBACK_STYLE = {
  icon: ShieldPlus,
};

const CategoryIllustration = ({ categoryName }) => {
  const style = CATEGORY_STYLES[categoryName] || FALLBACK_STYLE;
  const Icon = style.icon;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-pills-pink/10 ring-1 ring-pills-pink/20">
      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-gray-950" />
      <span className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-white shadow-sm" />
      <Icon className="h-8 w-8 text-gray-950" strokeWidth={1.9} />
    </div>
  );
};

const ShopByCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await categoryAPI.getCategories();
      const allCats = data?.categories || [];
      // Only parent categories (no parent field -> null or missing)
      const parentCats = allCats.filter((c) => !c.parent);
      setCategories(parentCats);
    } catch (err) {
      console.error("[ShopByCategory] Failed to load:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load categories",
      );
      setCategories([]);
    } finally {
      setLoading(false);
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
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
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
          {categories.map((category) => {
            const count = category.productCount || 0;

            return (
              <Link
                key={category._id}
                to={`/medicines?category=${category._id}`}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand/30 sm:p-4"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-pills-pink/60 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                  <CategoryIllustration categoryName={category.name} />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-brand group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-gray-950">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {count} {count === 1 ? "Product" : "Products"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
