import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Clock } from 'lucide-react';
import { couponAPI, productAPI } from '../api/index.js';
import { useCart } from '../contexts/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [{ data }, couponResult] = await Promise.allSettled([
        productAPI.getProducts({ discount: true, limit: 24 }),
        couponAPI.getActiveCoupons(),
      ]).then((results) => {
        const productResult = results[0].status === 'fulfilled' ? results[0].value : { data: { products: [] } };
        const activeCouponResult = results[1].status === 'fulfilled' ? results[1].value : { data: { coupons: [] } };
        return [productResult, activeCouponResult];
      });
      setProducts(data.products || []);
      setCoupons((couponResult.data.coupons || []).slice(0, 4));
    } catch (err) {
      console.error('Failed to load offers:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-5 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-brand mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Flash banner */}
      <div className="bg-gradient-to-r from-brand-deep to-brand rounded-2xl p-4 mb-5 text-white sm:p-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Special Offers</h1>
            <p className="text-white/80">Exclusive deals on medicines and healthcare products</p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-4 py-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Limited time only</span>
          </div>
        </div>
      </div>

      {coupons.length > 0 && (
        <div className="mb-5 rounded-2xl border border-green-100 bg-green-50/70 p-3 sm:mb-6 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-700" />
            <h2 className="text-sm font-bold text-green-950">Coupons</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {coupons.map((coupon) => (
              <div key={coupon._id} className="rounded-xl border border-green-100 bg-white px-3 py-2">
                <p className="font-mono text-xs font-bold text-green-800">{coupon.code}</p>
                <p className="mt-1 text-[11px] font-semibold text-gray-700">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `PHP ${Number(coupon.discountValue || 0).toLocaleString()} off`}
                  {coupon.maxDiscountAmount ? `, max PHP ${Number(coupon.maxDiscountAmount).toLocaleString()}` : ''}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">Min PHP {Number(coupon.minOrderAmount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 animate-pulse sm:p-4">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No active offers at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
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
      )}
    </div>
  );
};

export default Offers;
