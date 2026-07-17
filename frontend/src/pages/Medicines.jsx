import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { productAPI, categoryAPI } from '../api/index.js';
import { useCart } from '../contexts/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { getPageState, setPageState } from '../utils/pageCache.js';

const Medicines = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const cacheKey = location.pathname + location.search;
  const cachedState = getPageState(cacheKey);

  const [products, setProducts] = useState(() => cachedState?.products || []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(() => (cachedState ? false : true));
  const [page, setPage] = useState(() => cachedState?.page || 1);
  const [hasMore, setHasMore] = useState(() => (cachedState ? cachedState.hasMore : true));
  const [categoryScrollState, setCategoryScrollState] = useState({
    parent: { left: false, right: false },
    child: { left: false, right: false },
  });
  const { addToCart } = useCart();
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  
  const categoryScrollRef = useRef(null);
  const subCategoryScrollRef = useRef(null);
  const loaderRef = useRef(null);
  const loadRequestRef = useRef(0);
  const isFirstRender = useRef(true);

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent),
    [categories]
  );

  const selectedCategoryData = useMemo(
    () => categories.find((category) => String(category._id) === String(selectedCategory)),
    [categories, selectedCategory]
  );

  const activeParentCategory = selectedCategoryData?.parent || selectedCategory;
  const visibleSubCategories = useMemo(
    () => categories.filter((category) => String(category.parent || '') === String(activeParentCategory || '')),
    [categories, activeParentCategory]
  );

  const updateScrollState = (key, el) => {
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCategoryScrollState((prev) => ({
      ...prev,
      [key]: {
        left: el.scrollLeft > 4,
        right: el.scrollLeft < maxScroll - 4,
      },
    }));
  };

  // Scroll selected category into view horizontally
  useEffect(() => {
    if (!categoryScrollRef.current) return;
    if (!selectedCategory) {
      categoryScrollRef.current.scrollLeft = 0;
      requestAnimationFrame(() => updateScrollState('parent', categoryScrollRef.current));
      return;
    }
    const activeButton = categoryScrollRef.current.querySelector('[data-active="true"]');
    if (!activeButton) return;
    const container = categoryScrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    container.scrollLeft =
      buttonRect.left -
      containerRect.left -
      containerRect.width / 2 +
      buttonRect.width / 2 +
      container.scrollLeft;
    requestAnimationFrame(() => updateScrollState('parent', container));
  }, [selectedCategory, categories]);

  useEffect(() => {
    const child = subCategoryScrollRef.current;
    if (!child) return;
    child.scrollLeft = 0;
    requestAnimationFrame(() => updateScrollState('child', child));
  }, [activeParentCategory, visibleSubCategories.length]);

  useEffect(() => {
    const parent = categoryScrollRef.current;
    const child = subCategoryScrollRef.current;
    updateScrollState('parent', parent);
    updateScrollState('child', child);
  }, [categories, visibleSubCategories.length]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await categoryAPI.getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // API Call for products
  const loadData = useCallback(async (pageNum, append = false, categoryId = '', searchQuery = '') => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    try {
      setLoading(true);
      const params = { page: pageNum, limit: 24 };
      if (searchQuery) params.search = searchQuery;
      if (categoryId) params.category = categoryId;

      const { data } = await productAPI.getProducts(params);
      if (requestId !== loadRequestRef.current) return;

      const newProducts = data.products || [];
      const totalPages = data.pagination?.pages || 1;

      if (append) {
        setProducts(prev => {
          const existingIds = new Set(prev.map((p) => p._id));
          return [...prev, ...newProducts.filter((p) => !existingIds.has(p._id))];
        });
      } else {
        setProducts(newProducts);
      }
      setHasMore(pageNum < totalPages && newProducts.length > 0);
    } catch (err) {
      if (requestId !== loadRequestRef.current) return;
      console.error('Failed to load products:', err);
      if (!append) setProducts([]);
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, []);

  // Reset and load products when search or category changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (cachedState) {
        return;
      }
    }
    setPage(1);
    setHasMore(true);
    setProducts([]);
    setInitialLoading(true);
    loadData(1, false, selectedCategory, search);
  }, [search, selectedCategory, loadData, cachedState]);

  // Keep page cache in sync
  useEffect(() => {
    if (!initialLoading) {
      setPageState(cacheKey, { products, page, hasMore });
    }
  }, [products, page, hasMore, cacheKey, initialLoading]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            loadData(nextPage, true, selectedCategory, search);
            return nextPage;
          });
        }
      },
      { rootMargin: '200px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadData, selectedCategory, search]);

  const handleCategorySelect = (catId) => {
    const nextParams = {};
    if (search) nextParams.search = search;
    if (catId) nextParams.category = catId;
    setSearchParams(nextParams);
  };

  const scrollCategoryStrip = (ref, direction = 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(120, el.clientWidth * 0.45),
      behavior: 'smooth',
    });
  };

  return (
    <div className="container-custom py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-brand mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCategoryData ? selectedCategoryData.name : 'All Medicines'}
          </h1>
          {search ? (
            <p className="text-sm text-gray-500 mt-1">Search results for "{search}"</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Browse our complete catalog</p>
          )}
        </div>
      </div>

      {/* Parent Categories Strip */}
      <div className="relative mb-4">
        <div
          ref={categoryScrollRef}
          onScroll={(e) => updateScrollState('parent', e.currentTarget)}
          className={`flex snap-x gap-2 overflow-x-auto pb-2 scrollbar-hide ${
            categoryScrollState.parent.left ? 'pl-10' : 'pl-0'
          } ${categoryScrollState.parent.right ? 'pr-12' : 'pr-0'}`}
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            onClick={() => handleCategorySelect('')}
            data-active={selectedCategory === ''}
            className={`snap-start px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {parentCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat._id)}
              data-active={String(activeParentCategory || '') === String(cat._id)}
              className={`snap-start px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === String(cat._id)
                  ? 'bg-brand text-white'
                  : String(activeParentCategory || '') === String(cat._id)
                    ? 'bg-brand/10 text-brand'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {categoryScrollState.parent.left && (
          <button
            type="button"
            onClick={() => scrollCategoryStrip(categoryScrollRef, -1)}
            className="absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent pb-2"
            aria-label="Show previous categories"
          >
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-brand">
              <ChevronLeft className="h-4 w-4" />
            </span>
          </button>
        )}
        {categoryScrollState.parent.right && (
          <button
            type="button"
            onClick={() => scrollCategoryStrip(categoryScrollRef)}
            className="absolute inset-y-0 right-0 flex w-16 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent pb-2"
            aria-label="Show more categories"
          >
            <span className="mr-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-brand">
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        )}
      </div>

      {/* Child Categories Strip */}
      {visibleSubCategories.length > 0 && (
        <div className="relative mb-6">
          <div
            ref={subCategoryScrollRef}
            onScroll={(e) => updateScrollState('child', e.currentTarget)}
            className={`flex snap-x gap-2 overflow-x-auto pb-2 scrollbar-hide ${
              categoryScrollState.child.left ? 'pl-10' : 'pl-0'
            } ${categoryScrollState.child.right ? 'pr-12' : 'pr-0'}`}
            style={{ scrollbarWidth: 'none' }}
          >
            {visibleSubCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategorySelect(cat._id)}
                data-active={selectedCategory === String(cat._id)}
                className={`snap-start px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === String(cat._id)
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {categoryScrollState.child.left && (
            <button
              type="button"
              onClick={() => scrollCategoryStrip(subCategoryScrollRef, -1)}
              className="absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent pb-2"
              aria-label="Show previous subcategories"
            >
              <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-brand">
                <ChevronLeft className="h-4 w-4" />
              </span>
            </button>
          )}
          {categoryScrollState.child.right && (
            <button
              type="button"
              onClick={() => scrollCategoryStrip(subCategoryScrollRef)}
              className="absolute inset-y-0 right-0 flex w-16 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent pb-2"
              aria-label="Show more subcategories"
            >
              <span className="mr-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-brand">
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      )}

      {initialLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
                onCardClick={() => navigate(`/product/${product.slug}`, {
                  state: { from: { pathname: location.pathname, search: location.search } },
                })}
                onCartClick={() => addToCart(product, 1)}
              />
            ))}
          </div>

          {/* Infinite Scroll Loader */}
          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
            </div>
          )}

          {!hasMore && products.length > 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No more products</p>
          )}
        </>
      )}
    </div>
  );
};

export default Medicines;
