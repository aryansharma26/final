import { useEffect, useState } from 'react';
import { Tag, Zap } from 'lucide-react';
import { b2bCouponAPI } from '../api/index.js';

const formatCouponDiscount = (coupon) => {
  if (coupon.discountType === 'percentage') {
    return `${coupon.discountValue}% off${coupon.maxDiscountAmount ? ` up to PHP ${Number(coupon.maxDiscountAmount).toLocaleString()}` : ''}`;
  }
  return `PHP ${Number(coupon.discountValue || 0).toLocaleString()} off`;
};

const B2BCoupons = () => {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const { data } = await b2bCouponAPI.getActiveCoupons();
        setCoupons((data.coupons || []).slice(0, 3));
      } catch {
        setCoupons([]);
      }
    };
    loadCoupons();
  }, []);

  if (coupons.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-sm">
      <div className="flex min-w-0 items-center gap-2 bg-brand-light px-3 py-2 sm:gap-3 sm:px-3.5 sm:py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm sm:h-9 sm:w-9">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-gray-950 sm:text-sm">Bulk Coupons</p>
          <p className="truncate text-[11px] font-medium text-gray-500">Apply these during bulk checkout</p>
        </div>
        <span className="hidden shrink-0 rounded-full border border-brand/15 bg-white px-2.5 py-1 text-[11px] font-bold text-brand sm:inline-flex">
          Deals
        </span>
      </div>

      <div className="grid gap-2 p-2.5 sm:grid-cols-3 sm:p-3">
        {coupons.map((coupon) => (
          <div
            key={coupon._id}
            className="rounded-xl border border-gray-100 bg-white px-2.5 py-2 shadow-sm transition-colors hover:border-brand/30 hover:bg-brand-light"
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] font-bold text-gray-900">
                <Tag className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="truncate">{coupon.code}</span>
              </p>
              <p className="shrink-0 whitespace-nowrap text-[10px] font-bold text-brand">{formatCouponDiscount(coupon)}</p>
            </div>
            <p className="mt-1 text-[10px] font-medium text-gray-500">Min order PHP {Number(coupon.minOrderAmount || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default B2BCoupons;
