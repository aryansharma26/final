import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../api/index.js';
import { useCart } from '../contexts/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

const PopularProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await productAPI.getProducts({ popular: true, limit: 8 });
      const prods = data?.products || [];
      setProducts(prods);
    } catch (err) {
      console.error('[PopularProducts] Failed to load products:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 lg:py-16 bg-white">
        <div className="container-custom">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 animate-pulse sm:p-4">
                <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 lg:py-16 bg-white">
        <div className="container-custom text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-12 lg:py-16 bg-white">
        <div className="container-custom text-center">
          <p className="text-gray-500">No products available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-12 pb-8 lg:pt-16 lg:pb-10 bg-white">
      <div className="container-custom">
        <div className="mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Popular Products</h2>
            <p className="text-sm text-gray-500 mt-1">Most trusted by our customers</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              onCardClick={() => navigate(`/product/${product.slug}`)}
              onCartClick={() => addToCart(product, 1)}
              showHeart={true}
              animated={false}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/medicines"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/30"
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
