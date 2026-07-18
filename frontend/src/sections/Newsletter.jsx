import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check, Sparkles } from "lucide-react";
import { contactAPI } from "../api/index.js";
import useSessionOnce from "../hooks/useSessionOnce.js";

const Newsletter = () => {
  const shouldAnimate = useSessionOnce("homeAnimationsSeen");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      setError("");
      await contactAPI.submitContact({
        name: "Newsletter Subscriber",
        email,
        subject: "Newsletter Subscription",
        message: "User subscribed to newsletter via footer form",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
      }, 3000);
    } catch (err) {
      setError("Failed to subscribe. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gray-900">
      <div className="container-custom">
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={shouldAnimate ? { once: true } : undefined}
          transition={shouldAnimate ? { duration: 0.5 } : undefined}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-300 mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gray-300" />
            Health Newsletter
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
            Stay Healthy, Stay Informed
          </h2>
          <p className="text-sm text-gray-400 mb-5 leading-relaxed sm:text-base sm:mb-8">
            Subscribe to our health newsletter for medicine reminders, wellness
            tips, and exclusive offers delivered to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
          >
            <div className="relative w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitted}
              className={`pressable w-full sm:w-auto px-6 py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                submitted
                  ? "bg-green-500 text-white"
                  : "bg-brand hover:bg-brand-dark text-white"
              }`}
            >
              {submitted ? (
                <>
                  <Check className="w-5 h-5" /> Subscribed
                </>
              ) : (
                <>
                  Subscribe <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          <p className="text-xs text-gray-500 mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
