import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
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
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
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
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
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
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
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
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
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
  const dropdownTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { banner } = useSettings();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileSearchRef = useRef(null);

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
    navigate(`/product/${product.slug}`);
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
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}
    >
      {/* Dynamic Offer Banner */}
      {banner && banner.show && (
        <div
          className="w-full text-center py-2 px-4 text-xs sm:text-sm font-semibold select-none flex items-center justify-center gap-2 hover:opacity-95 transition-opacity bg-pills-pink text-white"
        >
          {banner.link ? (
            <Link to={banner.link} className="hover:underline flex items-center gap-1">
              <span>{banner.text}</span>
            </Link>
          ) : (
            <span>{banner.text}</span>
          )}
        </div>
      )}
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between gap-2 sm:h-16 lg:h-[72px]">
          <Link to="/" className="flex h-full shrink-0 items-center overflow-hidden">
            <div className="flex h-32 w-40 items-center justify-center overflow-hidden rounded-lg sm:h-36 sm:w-44 lg:h-40 lg:w-44">
              <img
                src={logo}
                alt="Capsandpills"
                className="h-full w-full object-contain translate-y-0.5"
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
                placeholder="Search for medicines, brands..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
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
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMobileSearchOpen((prev) => !prev);
              }}
              className="rounded-full p-2 transition-colors hover:bg-gray-50 lg:hidden"
              aria-label="Search products"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            <Link
              to="/wishlist"
              className="hidden md:block relative p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Heart className="w-5 h-5 text-gray-600" />
            </Link>

            <Link
              to="/doctors"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-600 hover:border-gray-600 hover:text-white rounded-full transition-colors"
              title="Find Doctor"
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden lg:inline">Find Doctor</span>
            </Link>
            <Link
              to="/cart"
              className="relative p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-pills-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-full transition-colors sm:px-3"
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
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-[70] mt-1 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-brand hover:bg-gray-50"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-brand hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/prescriptions"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-brand hover:bg-gray-50"
                    >
                      My Prescriptions
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
              </Link>
            )}

            <button
              onClick={() => {
                setIsOpen((prev) => !prev);
                setIsMobileSearchOpen(false);
              }}
              className="rounded-full p-2 transition-colors hover:bg-gray-50 lg:hidden"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`border-t border-gray-100 bg-white shadow-sm lg:hidden transition-all duration-200 ${isMobileSearchOpen ? 'px-3 py-3 opacity-100 max-h-[1000px] overflow-visible' : 'px-3 py-0 opacity-0 max-h-0 overflow-hidden pointer-events-none'}`}
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
      </div>

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
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
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

                    {hasChildren && activeDropdown === cat._id && (
                      <div className="absolute top-full left-0 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        {children.map((child) => (
                          <Link
                            key={child._id}
                            to={`/medicines?category=${child._id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:text-brand hover:bg-gray-50 transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile menu ─── */}
      {isOpen && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-gray-100 bg-white shadow-lg lg:hidden">
          <div className="container-custom py-4 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-4" data-search-root="true">
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
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-[16px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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
            </form>
            {isAuthenticated && (
              <div className="px-4 py-3 border-b border-gray-100 mb-2">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            )}
            {isAuthenticated && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" /> My Orders
                </Link>
                <Link
                  to="/prescriptions"
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" /> My Prescriptions
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" /> Sign In
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-gray-100">
              <Link
                to="/doctors"
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-600 hover:border-gray-600 hover:text-white rounded-lg transition-colors"
              >
                <Stethoscope className="w-4 h-4" /> Find Doctor
              </Link>
            </div>
            <div className="pt-2 border-t border-gray-100 mt-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Categories
              </p>
              {catLoading
                ? [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="px-4 py-3 h-8 bg-gray-100 rounded-lg animate-pulse mb-1"
                    />
                  ))
                : parentCategories.map((cat) => (
                    <div key={cat._id}>
                      <CategoryLink
                        cat={cat}
                        className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      />
                      {(childMap[cat._id] || []).map((child) => (
                        <CategoryLink
                          key={child._id}
                          cat={child}
                          className="block px-4 py-2 text-sm text-gray-500 hover:text-brand hover:bg-gray-50 rounded-lg transition-colors pl-8"
                        />
                      ))}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

