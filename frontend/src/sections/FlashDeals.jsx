import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext.jsx";

const FlashDeals = () => {
  const { flashDeal } = useSettings();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!flashDeal || !flashDeal.show) return;

    const calculateTimeLeft = () => {
      const end = new Date((flashDeal.endDate || "").replace(" ", "T"));
      const now = new Date();
      const diff = end - now;

      if (diff <= 0) {
        setIsExpired(true);
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [flashDeal]);

  if (!flashDeal || !flashDeal.show) return null;

  const pad = (num) => String(num).padStart(2, "0");

  return (
    <section className="bg-gray-900 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:py-4">
      <div className="container-custom">
        <div className="flex min-w-0 flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-pills-pink/30 bg-pills-pink/15 shadow-inner sm:h-10 sm:w-10 sm:rounded-2xl">
              <Zap className="h-3.5 w-3.5 text-pills-pink sm:h-4 sm:w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xs font-bold text-white sm:text-base">
                {flashDeal.headline}
              </h3>

              <p className="hidden truncate text-[11px] font-medium text-gray-400 min-[430px]:block sm:text-sm">
                {flashDeal.subtext}
              </p>
            </div>
          </div>

          {/* Center */}
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
            {isExpired ? (
              <span className="text-xs font-semibold text-pills-pink sm:text-sm">
                Deal Expired
              </span>
            ) : (
              <>
                <span className="hidden text-xs font-semibold text-gray-400 sm:inline">
                  Ends in
                </span>

                <div className="flex items-center gap-1">
                  <div className="min-w-[28px] rounded-md border border-gray-700 bg-gray-900 px-1 py-0.5 text-center sm:min-w-[40px] sm:rounded-lg sm:px-2 sm:py-1">
                    <span className="text-xs font-bold tabular-nums text-white sm:text-sm">
                      {pad(timeLeft.hours)}
                    </span>
                  </div>

                  <span className="text-xs text-gray-500 sm:text-base">:</span>

                  <div className="min-w-[28px] rounded-md border border-gray-700 bg-gray-900 px-1 py-0.5 text-center sm:min-w-[40px] sm:rounded-lg sm:px-2 sm:py-1">
                    <span className="text-xs font-bold tabular-nums text-white sm:text-sm">
                      {pad(timeLeft.minutes)}
                    </span>
                  </div>

                  <span className="text-xs text-gray-500 sm:text-base">:</span>

                  <div className="min-w-[28px] rounded-md border border-gray-700 bg-gray-900 px-1 py-0.5 text-center sm:min-w-[40px] sm:rounded-lg sm:px-2 sm:py-1">
                    <span className="text-xs font-bold tabular-nums text-white sm:text-sm">
                      {pad(timeLeft.seconds)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right */}
          <Link
            to={flashDeal.buttonLink || "/offers"}
            className="shrink-0 rounded-full bg-pills-pink px-3 py-2 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-pills-pink-dark sm:px-7 sm:py-2.5 sm:text-sm"
          >
            {flashDeal.buttonText || "Shop Now"}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashDeals;
