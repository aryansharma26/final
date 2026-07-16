import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import Lottie from "lottie-react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";
import preventiveHealthcare from "../assets/lottie/preventivehealthcare.json";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const rawRedirect =
    searchParams.get("redirect") || location.state?.from?.pathname || "/";
  const redirect =
    /^\/(?!\/)/.test(rawRedirect) && !rawRedirect.includes("://")
      ? rawRedirect
      : "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.success) {
        navigate(redirect, { replace: true });
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden min-h-[250px] overflow-hidden bg-white lg:flex lg:min-h-screen lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative z-10 flex w-full flex-col gap-2 p-4 sm:p-5 lg:h-screen lg:gap-4 lg:p-6 xl:p-8">
            <div className="flex items-start justify-between overflow-hidden">
              <img
                src={logo}
                alt="Caps and Pills"
                className="h-14 w-auto max-w-[170px] shrink-0 object-contain sm:h-16 sm:max-w-[210px] lg:h-24 lg:max-w-[260px] xl:h-28 xl:max-w-[320px]"
              />
            </div>

            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-start py-0 lg:py-1">
              <div className="-mt-6 h-[120px] w-full sm:h-[150px] lg:-mt-8 lg:h-[320px] xl:h-[390px]">
                <Lottie
                  animationData={preventiveHealthcare}
                  loop
                  autoplay
                  className="h-full w-full"
                />
              </div>
              <div className="mt-0 grid w-full grid-cols-2 gap-2 sm:gap-3 lg:mt-2 lg:gap-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:p-4">
                  <ShieldCheck className="h-4 w-4 text-pills-pink" />
                  <p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm lg:mt-2">
                    Verified care
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-[11px] lg:mt-1">
                    Secure access to your medicine orders.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:p-4">
                  <Truck className="h-4 w-4 text-pills-pink" />
                  <p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm lg:mt-2">
                    Fast delivery
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-[11px] lg:mt-1">
                    Track carts, checkout, and orders in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-0 items-start justify-center px-4 py-4 pt-10 sm:px-6 lg:min-h-screen lg:items-center lg:px-10 lg:pt-4">
          <div className="relative w-full max-w-full lg:max-w-xl">
            <div className="pointer-events-none absolute left-1 top-1 z-0 overflow-hidden opacity-15 lg:hidden">
              <img
                src={logo}
                alt="Caps and Pills"
                className="block h-auto w-[120px] max-w-[55vw] object-contain sm:w-[140px]"
              />
            </div>

            <div className="relative z-10 max-w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-9">
              <button
                onClick={() => navigate('/')}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-pills-pink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-6">
                <p className="text-sm font-semibold text-pills-pink">
                  Welcome back
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Sign in to continue
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Access your cart, prescriptions, orders, and saved details.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-pills-pink hover:text-pills-pink-dark"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pills-pink text-sm font-bold text-white shadow-lg shadow-pills-pink/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pills-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Sign In <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                New to Caps and Pills?{" "}
                <Link
                  to={`/register?redirect=${encodeURIComponent(redirect)}`}
                  className="font-bold text-pills-pink hover:text-pills-pink-dark"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
