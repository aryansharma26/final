import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';
import { wishlistAPI } from '../api/index.js';
import { useCart } from '../contexts/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await wishlistAPI.getWishlist();
      setItems(data.wishlist?.products || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setItems((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const moveToCart = async (product) => {
    try {
      await addToCart(product, 1);
      await wishlistAPI.removeFromWishlist(product._id);
      setItems((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      console.error('Failed to move to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8 sm:py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-5 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Your Wishlist</h1>
        </div>

        <div className="min-h-[34vh] sm:min-h-[42vh] flex flex-col items-center justify-center text-center">
          <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mb-4 sm:mb-5" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-500 mb-5 sm:mb-7">Save items you love for later.</p>
          <Link to="/medicines" className="inline-flex items-center gap-2 px-7 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-5 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-brand mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">My Wishlist ({items.length} items)</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {items.map((product, index) => (
          <ProductCard
            key={product._id}
            product={product}
            index={index}
            onCardClick={() => navigate(`/product/${product.slug}`, {
              state: { from: { pathname: location.pathname, search: location.search } },
            })}
            onActionClick={() => moveToCart(product)}
            actionLabel="Move to Cart"
            actionIcon={<ShoppingCart className="w-4 h-4" />}
            showRemoveButton={true}
            onRemoveClick={() => removeItem(product._id)}
            showRating={false}
            stackedActions={true}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
