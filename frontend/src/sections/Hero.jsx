import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle,
  ChevronRight,
  HelpCircle,
  Layers3,
  Loader2,
  Package,
  Pill,
  Search,
  Tag,
  Upload,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productAPI, categoryAPI } from "../api/index.js";

const FAQ_LINKS = [
  { label: "Rx quote process", to: "/faq#rx-quote" },
  { label: "Bulk buying", to: "/faq#bulk-buying" },
  { label: "Order tracking", to: "/faq#order-tracking" },
  { label: "Delivery help", to: "/faq#delivery" },
];

const getImageUrl = (product) => {
  const image = product?.images?.[0];
  return typeof image === "string" ? image : image?.url || "";
};

const formatPrice = (product) => {
  const price = product?.discountPrice > 0 ? product.discountPrice : product?.price;
  return typeof price === "number" ? `PHP ${price.toLocaleString()}` : "";
};

const Hero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    products: [],
    brands: [],
    categories: [],
  });

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSuggestions({ products: [], brands: [], categories: [] });
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const { data } = await productAPI.getSearchSuggestions(query, {
          signal: controller.signal,
        });
        setSuggestions({
          products: data?.products || [],
          brands: data?.brands || [],
          categories: data?.categories || [],
        });
      } catch (err) {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Failed to fetch suggestions:", err);
          setSuggestions({ products: [], brands: [], categories: [] });
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const delayedNavigate = (e, path) => {
    e.preventDefault();
    const currentTarget = e.currentTarget;
    if (currentTarget && currentTarget.classList) {
      currentTarget.classList.add("pressed");
    }
    setTimeout(() => {
      navigate(path);
      if (currentTarget && currentTarget.classList) {
        currentTarget.classList.remove("pressed");
      }
    }, 150);
  };

  const submitSearch = (overrideQuery) => {
    const term = (typeof overrideQuery === "string" ? overrideQuery : searchQuery).trim();
    if (!term) return;
    setSuggestionsOpen(false);
    navigate(`/medicines?search=${encodeURIComponent(term)}`);
  };

  const openProduct = (product) => {
    setSuggestionsOpen(false);
    navigate(`/product/${product.slug || product._id}`);
  };

  const searchBrand = (brand) => {
    setSuggestionsOpen(false);
    navigate(`/medicines?brand=${encodeURIComponent(brand)}`);
  };

  const openCategory = (category) => {
    setSuggestionsOpen(false);
    navigate(`/medicines?category=${encodeURIComponent(category.slug || category._id)}`);
  };

  const totalSuggestions =
    (suggestions.products?.length || 0) +
    (suggestions.brands?.length || 0) +
    (suggestions.categories?.length || 0);

  const hasSuggestions = totalSuggestions > 0;

  return (
    <section className="relative z-20 overflow-visible bg-[#f7f8f3] pt-4 pb-10 sm:pt-8 lg:pt-3 lg:pb-12">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:52px_52px]" />{" "}
      <div className="container-custom relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white/85 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm"
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            Trusted healthcare at your doorstep
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-tight text-gray-950 sm:text-5xl lg:text-[56px]"
          >
            Your Health, Delivered to Your Doorstep
          </motion.h1>

          {/* <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-5 max-w-3xl"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to="/prescriptions"
                onClick={(e) => delayedNavigate(e, "/prescriptions")}
                className="pressable route-pressable group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/95 px-3 py-2.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
              >
                <div className="relative flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200">
                    <Upload className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          For Patients
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          Upload Prescription
                        </p>
                      </div>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                      Upload your prescription and get genuine medicines
                      delivered to your doorstep.
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/b2b-enquiry"
                onClick={(e) => delayedNavigate(e, "/b2b-enquiry")}
                className="pressable route-pressable group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/95 px-3 py-2.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
              >
                <div className="relative flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200">
                    <Pill className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          FOR BUSINESSES
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          Bulk Purchase
                        </p>
                      </div>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                      Bulk medicine orders for pharmacies, retail stores,
                      clinics, and healthcare providers at competitive wholesale
                      prices.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div> */}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="mx-auto mt-7 max-w-2xl"
            data-hero-search="true"
            ref={searchContainerRef}
          >
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="relative flex min-h-[58px] items-center rounded-full border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.10)] transition-all focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10"
            >
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 shrink-0 text-gray-400" />
              <input
                name="hero-product-search"
                type="text"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setSuggestionsOpen(true);
                    setSuggestionsLoading(true);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setSuggestionsOpen(true);
                  }
                }}
                placeholder="Search for medicines, brands, or health products..."
                className="h-full w-full rounded-full bg-transparent py-4 pl-14 pr-32 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none sm:text-base"
              />
              <button
                type="submit"
                className="no-press-animation hero-search-submit absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-950 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-gray-950/20 transition-all duration-200 hover:-translate-y-[52%] hover:bg-gray-800 sm:px-6 sm:py-2.5"
              >
                Search
              </button>
            </form>

            {suggestionsOpen && searchQuery.trim() && (
              <div className="relative z-[90]">
                <div className="absolute left-0 right-0 top-3 overflow-hidden rounded-lg border border-gray-100 bg-white text-left shadow-xl">
                  {suggestionsLoading ? (
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching medicines...
                    </div>
                  ) : hasSuggestions ? (
                    <div className="max-h-[420px] overflow-y-auto py-2">
                      {suggestions.products.length > 0 && (
                        <div className="pb-2">
                          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Products
                          </p>
                          {suggestions.products.map((product) => (
                            <button
                              key={product._id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => openProduct(product)}
                              className="no-press-animation flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                {getImageUrl(product) ? (
                                  <img
                                    src={getImageUrl(product)}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {product.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {[product.brand, formatPrice(product)]
                                    .filter(Boolean)
                                    .join(" | ")}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {suggestions.brands.length > 0 && (
                        <div className="border-t border-gray-100 py-2">
                          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Brands
                          </p>
                          {suggestions.brands.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => searchBrand(brand)}
                              className="no-press-animation flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
                            >
                              <Tag className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{brand}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {suggestions.categories.length > 0 && (
                        <div className="border-t border-gray-100 py-2">
                          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Categories
                          </p>
                          {suggestions.categories.map((category) => (
                            <button
                              key={category._id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => openCategory(category)}
                              className="no-press-animation flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
                            >
                              <Layers3 className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{category.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-gray-100 p-2">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={submitSearch}
                          className="no-press-animation flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
                        >
                          <Search className="h-4 w-4" />
                          Search all results for "{searchQuery.trim()}"
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      <p className="px-1 py-2 text-sm text-gray-500">
                        No quick suggestions found.
                      </p>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={submitSearch}
                        className="no-press-animation flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
                      >
                        <Search className="h-4 w-4" />
                        Search all products
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

            <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-5 max-w-3xl"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to="/prescriptions"
                onClick={(e) => delayedNavigate(e, "/prescriptions")}
                className="pressable route-pressable group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/95 px-3 py-2.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
              >
                <div className="relative flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200">
                    <Upload className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          For Patients
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          Upload Prescription
                        </p>
                      </div>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                      Upload your prescription and get genuine medicines
                      delivered to your doorstep.
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/b2b-enquiry"
                onClick={(e) => delayedNavigate(e, "/b2b-enquiry")}
                className="pressable route-pressable group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/95 px-3 py-2.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
              >
                <div className="relative flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200">
                    <Pill className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          FOR BUSINESSES
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          Bulk Purchase
                        </p>
                      </div>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                      Bulk medicine orders for pharmacies, retail stores,
                      clinics, and healthcare providers at competitive wholesale
                      prices.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/faq"
              className="pressable route-pressable inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand hover:shadow-md"
            >
              <HelpCircle className="h-3.5 w-3.5 text-brand" />
              Help Center
            </Link>
            {FAQ_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="pressable rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand hover:shadow-md"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
