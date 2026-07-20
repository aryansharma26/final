import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingCart,
  User,
  ChevronDown,
  LogOut,
  Stethoscope,
  Package,
  FileText,
  Tag,
  Layers3,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { categoryAPI, productAPI } from "../api/index.js";

import logo from "../assets/logo.png";

const getImageUrl = (product) => {
  const image = product?.images?.[0];
  return typeof image === "string" ? image : image?.url || "";
};

const formatPrice = (product) => {
  const price = product?.discountPrice > 0 ? product.discountPrice : product?.price;
  return typeof price === "number" ? `PHP ${price.toLocaleString()}` : "";
};

const mobileItemMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const SearchSuggestions = ({
  query,
  suggestions,
  loading,
  open,
  onSearch,
  onProduct,
  onBrand,
  onCategory,
}) => {
  if (!open || query.trim().length < 1) return null;

  const products = suggestions.products || [];
  const brands = suggestions.brands || [];
  const categories = suggestions.categories || [];
  const hasResults = products.length > 0 || brands.length > 0 || categories.length > 0;

  return (
    <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching medicines...
        </div>
      ) : hasResults ? (
        <div className="max-h-[420px] overflow-y-auto py-2">
          {categories.length > 0 && (
            <div className="pb-2">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Categories
              </p>
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onCategory(category)}
                  className="no-press-animation flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand focus:outline-none focus-visible:outline-none"
                >
                  <Layers3 className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{category.name}</span>
                </button>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className={`${categories.length > 0 ? "border-t border-gray-100" : ""} pb-2 pt-2`}>
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Products
              </p>
              {products.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onProduct(product)}
                  className="no-press-animation flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:outline-none"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {getImageUrl(product) ? (
                      <img src={getImageUrl(product)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {[product.brand, formatPrice(product)].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {brands.length > 0 && (
            <div className="border-t border-gray-100 py-2">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Brands
              </p>
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onBrand(brand)}
                  className="no-press-animation flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand focus:outline-none focus-visible:outline-none"
                >
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{brand}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSearch}
              className="no-press-animation flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5 focus:outline-none focus-visible:outline-none"
            >
              <Search className="h-4 w-4" />
              Search all results for "{query.trim()}"
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <p className="px-1 py-2 text-sm text-gray-500">No quick suggestions found.</p>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSearch}
            className="no-press-animation flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5 focus:outline-none focus-visible:outline-none"
          >
            <Search className="h-4 w-4" />
            Search all products
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState({
    products: [],
    brands: [],
    categories: [],
  });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState(null);
  const dropdownTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { banner } = useSettings();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [isOpen]);

  const openDropdown = (id) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(id);
    }, 150);
  };

  const closeDropdown = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const closeSearchSuggestions = () => {
    setSuggestionsOpen(false);
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchSuggestions({ products: [], brands: [], categories: [] });
    closeSearchSuggestions();
  };

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      navigate(`/medicines?search=${encodeURIComponent(query)}`);
      resetSearch();
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    submitSearch();
  };

  const handleProductSuggestion = (product) => {
    if (!product?.slug) return;
    navigate(`/product/${product.slug}`, {
      state: { from: { pathname: location.pathname, search: location.search } },
    });
    resetSearch();
    setIsOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleBrandSuggestion = (brand) => {
    if (!brand) return;
    navigate(`/medicines?search=${encodeURIComponent(brand)}`);
    resetSearch();
    setIsOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleCategorySuggestion = (category) => {
    if (!category?._id) return;
    navigate(`/medicines?category=${category._id}`);
    resetSearch();
    setIsOpen(false);
    setIsMobileSearchOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      setIsMobileSearchOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setActiveDropdown(null);
    setUserMenuOpen(false);
    resetSearch();
  }, [location]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 1) {
      setSearchSuggestions({ products: [], brands: [], categories: [] });
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const { data } = await productAPI.getSearchSuggestions(query, {
          signal: controller.signal,
        });
        setSearchSuggestions({
          products: data?.products || [],
          brands: data?.brands || [],
          categories: data?.categories || [],
        });
        setSuggestionsOpen(true);
      } catch (err) {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("[Navbar] Failed to load search suggestions:", err);
          setSearchSuggestions({ products: [], brands: [], categories: [] });
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (!e.target.closest('[data-search-root="true"]')) {
        closeSearchSuggestions();
        setIsMobileSearchOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeSearchSuggestions();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCatLoading(true);
        const { data } = await categoryAPI.getCategories();
        const cats = data?.categories || [];
        setCategories(cats);
      } catch (err) {
        console.error("[Navbar] Failed to load categories:", err);
        setCategories([]);
      } finally {
        setCatLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  const { parentCategories, childMap } = useMemo(() => {
    const parents = categories
      .filter((c) => !c.parent)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const children = {};
    parents.forEach((p) => {
      children[p._id] = categories
        .filter((c) => c.parent === p._id || c.parent?._id === p._id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return { parentCategories: parents, childMap: children };
  }, [categories]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const CategoryLink = ({ cat, className, onClick }) => (
    <Link
      to={`/medicines?category=${cat._id}`}
      className={className}
      onClick={onClick}
    >
      {cat.name}
    </Link>
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white bg-opacity-100 transition-shadow duration-300 lg:border-b-0 ${scrolled || isOpen ? "shadow-sm" : ""}`}
    >
      {/* Dynamic Offer Banner */}
      {banner && banner.show && (
        <div
          className="w-full text-center py-2 px-4 text-xs sm:text-sm font-semibold select-none flex items-center justify-center gap-2 hover:opacity-95 transition-opacity bg-pills-pink text-white"
        >
          {banner.link ? (
            <Link to={banner.link} className="pressable hover:underline flex items-center gap-1">
              <span>{banner.text}</span>
            </Link>
          ) : (
            <span>{banner.text}</span>
          )}
        </div>
      )}
      <div className="container-custom bg-white">
        <div className="flex h-[54px] items-center justify-between gap-2 pb-0.5 sm:h-16 sm:pb-0 lg:h-[72px]">
          <Link to="/" className="pressable flex h-full shrink-0 items-center overflow-hidden">
            <div className="flex h-[76px] w-32 items-center justify-center overflow-hidden rounded-lg sm:h-28 sm:w-40 lg:h-40 lg:w-44">
              <img
                src={logo}
                alt="Capsandpills"
                className="h-full w-full translate-y-1 object-contain sm:translate-y-1 lg:translate-y-0.5"
              />
            </div>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-xl mx-8"
            data-search-root="true"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="nav-product-search"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 1) {
                    setSuggestionsOpen(true);
                    setSuggestionsLoading(true);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 1) setSuggestionsOpen(true);
                }}
                placeholder="Search for medicines, brands, or healthcare products..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-base outline-none transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus-visible:outline-none lg:text-sm"
              />
              <SearchSuggestions
                query={searchQuery}
                suggestions={searchSuggestions}
                loading={suggestionsLoading}
                open={suggestionsOpen}
                onSearch={submitSearch}
                onProduct={handleProductSuggestion}
                onBrand={handleBrandSuggestion}
                onCategory={handleCategorySuggestion}
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.82, y: 2 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              onClick={() => {
                setIsOpen(false);
                setIsMobileSearchOpen((prev) => !prev);
              }}
              className={`nav-pressable rounded-full border p-2 shadow-sm transition-all lg:hidden ${
                isMobileSearchOpen
                  ? "border-gray-200 bg-white text-gray-600 shadow-sm"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
              aria-label="Search products"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </motion.button>
            <Link
              to="/wishlist"
              className="pressable nav-pressable relative hidden rounded-full border border-gray-100 bg-white p-2 shadow-sm transition-all md:block"
            >
              <Heart className="w-5 h-5 text-gray-600" />
            </Link>

            <Link
              to="/doctors"
              className="pressable nav-pressable hidden items-center gap-1.5 rounded-full border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all md:flex"
              title="Find Doctor"
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden lg:inline">Find Doctor</span>
            </Link>
            <Link
              to="/cart"
              className="pressable nav-pressable relative rounded-full border border-gray-100 bg-white p-2 shadow-sm transition-all"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [1, 1.35, 0.95, 1], opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="nav-badge absolute -top-0.5 -right-0.5 z-20 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-pills-pink px-0.5 text-[8px] font-bold leading-none text-white"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="pressable nav-pressable flex items-center gap-2 rounded-full border border-gray-100 bg-white px-2 py-1 shadow-sm transition-all sm:px-3"
                >
                  <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-brand font-bold text-xs">
                      {user?.name?.[0] || "U"}
                    </span>
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 top-full z-[70] mt-1 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="no-press-animation block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="no-press-animation block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/prescriptions"
                      onClick={() => setUserMenuOpen(false)}
                      className="no-press-animation block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand"
                    >
                      My Prescriptions
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="no-press-animation flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="pressable nav-pressable rounded-full border border-gray-100 bg-white p-2 shadow-sm transition-all"
              >
                <User className="w-5 h-5 text-gray-600" />
              </Link>
            )}

            <button
              onClick={() => {
                setIsOpen((prev) => {
                  const next = !prev;
                  if (next) setMobileExpandedCategory(null);
                  return next;
                });
                setIsMobileSearchOpen(false);
              }}
              className={`nav-pressable rounded-full border p-2 shadow-sm transition-all lg:hidden ${
                isOpen
                  ? "border-gray-200 bg-white text-gray-600 shadow-sm"
                  : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.14 }}
                  className="block"
                >
                  {isOpen ? (
                    <X className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Menu className="h-5 w-5 text-gray-600" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileSearchOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0, y: -8 }}
        animate={{ opacity: 1, height: "auto", y: 0 }}
        exit={{ opacity: 0, height: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="overflow-visible border-t border-gray-100 bg-white px-3 py-3 shadow-sm lg:hidden"
      >
        <form onSubmit={handleSearch} className="relative" data-search-root="true">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={mobileSearchRef}
            type="text"
            name="mobile-product-search"
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 1) {
                setSuggestionsOpen(true);
                setSuggestionsLoading(true);
              }
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 1) setSuggestionsOpen(true);
            }}
            placeholder="Search for medicines, brands..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[16px] transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <div className="relative">
            <SearchSuggestions
              query={searchQuery}
              suggestions={searchSuggestions}
              loading={suggestionsLoading}
              open={suggestionsOpen}
              onSearch={submitSearch}
              onProduct={handleProductSuggestion}
              onBrand={handleBrandSuggestion}
              onCategory={handleCategorySuggestion}
            />
          </div>
        </form>
      </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Desktop category bar with simple vertical dropdowns ─── */}
      <div className="hidden lg:block border-t border-gray-100">
        <div className="container-custom">
          {catLoading ? (
            <div className="flex items-center gap-1 h-11">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="px-3 py-2 h-8 w-24 bg-gray-100 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-0.5 h-11">
              {parentCategories.map((cat) => {
                const children = childMap[cat._id] || [];
                const hasChildren = children.length > 0;
                return (
                  <div
                    key={cat._id}
                    className="relative"
                    onMouseEnter={() => hasChildren && openDropdown(cat._id)}
                    onMouseLeave={closeDropdown}
                    >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        navigate(`/medicines?category=${cat._id}`);
                      }}
                      className={`no-press-animation flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeDropdown === cat._id
                          ? "text-gray-700 bg-gray-100"
                          : "text-gray-700 hover:text-brand hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                      {hasChildren && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${activeDropdown === cat._id ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {hasChildren && activeDropdown === cat._id && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute top-full left-0 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                      >
                        {children.map((child) => (
                          <Link
                            key={child._id}
                            to={`/medicines?category=${child._id}`}
                            className="no-press-animation block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile menu ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="lg:hidden"
          >
            <div className="fixed inset-x-0 top-[54px] h-[calc(100vh-54px)] bg-gray-100 sm:top-16 sm:h-[calc(100vh-64px)]" />
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative max-h-[calc(100vh-54px)] overflow-y-auto overscroll-contain border-t border-gray-100 bg-gray-50 shadow-xl sm:max-h-[calc(100vh-64px)]"
            >
              <div className="container-custom space-y-2 py-3 pb-24">
                <motion.form {...mobileItemMotion} onSubmit={handleSearch} className="relative mb-3" data-search-root="true">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="mobile-product-search"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length >= 1) {
                        setSuggestionsOpen(true);
                        setSuggestionsLoading(true);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 1) setSuggestionsOpen(true);
                    }}
                    placeholder="Search for medicines, brands..."
                    className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-[16px] shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <SearchSuggestions
                    query={searchQuery}
                    suggestions={searchSuggestions}
                    loading={suggestionsLoading}
                    open={suggestionsOpen}
                    onSearch={submitSearch}
                    onProduct={handleProductSuggestion}
                    onBrand={handleBrandSuggestion}
                    onCategory={handleCategorySuggestion}
                  />
                </motion.form>

                {isAuthenticated && (
                  <motion.div {...mobileItemMotion} transition={{ duration: 0.18, delay: 0.03 }} className="mb-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </motion.div>
                )}

                {isAuthenticated ? (
                  <>
                    {[
                      { to: "/profile", label: "My Profile", icon: User },
                      { to: "/orders", label: "My Orders", icon: ShoppingCart },
                      { to: "/prescriptions", label: "My Prescriptions", icon: FileText },
                    ].map(({ to, label, icon: Icon }, index) => (
                      <motion.div key={to} {...mobileItemMotion} transition={{ duration: 0.18, delay: 0.05 + index * 0.02 }}>
                        <Link to={to} className="no-press-animation flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                          <Icon className="w-4 h-4" /> {label}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.button
                      {...mobileItemMotion}
                      transition={{ duration: 0.18, delay: 0.11 }}
                      onClick={handleLogout}
                      className="no-press-animation flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </motion.button>
                  </>
                ) : (
                  <motion.div {...mobileItemMotion} transition={{ duration: 0.18, delay: 0.05 }}>
                    <Link to="/login" className="pressable nav-pressable flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                      <User className="w-4 h-4" /> Sign In
                    </Link>
                  </motion.div>
                )}

                <motion.div {...mobileItemMotion} transition={{ duration: 0.18, delay: 0.13 }} className="pt-1">
                  <Link to="/doctors" className="pressable nav-pressable flex w-full items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                    <Stethoscope className="w-4 h-4" /> Find Doctor
                  </Link>
                </motion.div>

                <motion.div {...mobileItemMotion} transition={{ duration: 0.18, delay: 0.15 }} className="mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Categories
                  </p>
                  {catLoading
                    ? [1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="mb-1 h-8 rounded-lg bg-gray-100 px-4 py-3 animate-pulse" />
                      ))
                    : parentCategories.map((cat) => {
                        const children = childMap[cat._id] || [];
                        const hasChildren = children.length > 0;
                        const isExpanded = mobileExpandedCategory === cat._id;

                        return (
                          <div key={cat._id}>
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => setMobileExpandedCategory(isExpanded ? null : cat._id)}
                                className="no-press-animation flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                              >
                                <span>{cat.name}</span>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                            ) : (
                              <CategoryLink
                                cat={cat}
                                className="no-press-animation block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                              />
                            )}

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  {children.map((child) => (
                                    <CategoryLink
                                      key={child._id}
                                      cat={child}
                                      className="no-press-animation ml-3 block rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand"
                                    />
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .nav-pressable {
          -webkit-tap-highlight-color: transparent;
          position: relative;
          overflow: hidden;
          outline: none;
          touch-action: manipulation;
          transform: translateZ(0);
        }
        .nav-pressable::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(249,250,251,0.9) 38%, rgba(243,244,246,0.5) 100%);
          opacity: 0;
          transform: scale(0.58);
          transition: opacity 240ms ease, transform 340ms ease;
          pointer-events: none;
        }
        .nav-pressable:hover {
          background-color: rgb(249 250 251);
          transform: translateY(-2px);
        }
        .nav-pressable:active {
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
          transform: translateY(1px) scale(0.88);
          transition-duration: 280ms;
        }
        .nav-pressable:active::after {
          opacity: 1;
          transform: scale(1.18);
        }
        .nav-pressable:focus,
        .nav-pressable:focus-visible {
          outline: none;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
        }
        .nav-pressable > :not(.nav-badge) {
          position: relative;
          z-index: 1;
        }
        .nav-pressable > .nav-badge {
          position: absolute;
          z-index: 5;
        }
        @media (hover: none) {
          .nav-pressable:active {
            background-color: rgb(249 250 251);
            box-shadow: 0 10px 26px rgba(15, 23, 42, 0.15);
            transform: translateY(2px) scale(0.84);
            transition-duration: 340ms;
          }
          .nav-pressable:active::after {
            opacity: 1;
            transform: scale(1.24);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;

