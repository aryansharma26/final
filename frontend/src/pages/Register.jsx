import { useState, useEffect } from "react";
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
  Phone,
  ShieldCheck,
  Truck,
  User,
  X,
} from "lucide-react";
import Lottie from "lottie-react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";
import preventiveHealthcare from "../assets/lottie/preventivehealthcare.json";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const rawRedirect =
    searchParams.get("redirect") || location.state?.from?.pathname || "/";
  const redirect =
    /^\/(?!\/)/.test(rawRedirect) && !rawRedirect.includes("://")
      ? rawRedirect
      : "/";

  useEffect(() => {
    const handlePopState = () => {
      const fromPath = location.state?.from?.pathname || searchParams.get("redirect") || "";
      const isProtected = ['/checkout', '/orders', '/profile', '/wishlist'].some((p) => fromPath.startsWith(p));
      if (isProtected) {
        if (fromPath.startsWith('/checkout')) {
          navigate('/cart', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.state, searchParams, navigate]);

  const handleClose = () => {
    const isProtected = (path) => {
      return ['/checkout', '/orders', '/profile', '/wishlist'].some((p) => path.startsWith(p));
    };
    const fromPath = location.state?.from?.pathname || searchParams.get("redirect") || "/";

    if (isProtected(fromPath)) {
      if (fromPath.startsWith('/checkout')) {
        navigate('/cart', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    if (fromPath !== '/' && !isProtected(fromPath)) {
      navigate(fromPath, { replace: true });
    } else {
      if (window.history.length > 1 && location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      if (result.success) {
        navigate(redirect, { replace: true, state: location.state?.from?.state });
      } else {
        setError(result.error || "Registration failed");
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

        <section className="relative flex min-h-0 items-start justify-center px-4 py-4 pt-10 sm:px-6 lg:min-h-screen lg:items-center lg:px-8 lg:pt-4">
          <div className="relative w-full max-w-full lg:max-w-[44rem]">
            <div className="relative z-10 max-w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <button
                onClick={handleClose}
                className="pressable absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-pills-pink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="border-b border-slate-100 bg-slate-50/70 px-7 py-5 sm:px-9">
                <img
                  src={logo}
                  alt="Caps and Pills"
                  className="h-12 w-auto object-contain lg:hidden"
                />
                <p className="text-sm font-semibold text-pills-pink">
                  Create account
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Start shopping smarter
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Save your details for faster medicine orders and checkout.
                </p>
              </div>

              <div className="p-7 sm:p-9">

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                        placeholder="Password"
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
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>



                <button
                  type="submit"
                  disabled={loading}
                  className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pills-pink text-sm font-bold text-white shadow-lg shadow-pills-pink/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pills-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to={`/login?redirect=${encodeURIComponent(redirect)}`}
                  state={location.state}
                  className="pressable font-bold text-pills-pink hover:text-pills-pink-dark"
                >
                  Sign in
                </Link>
              </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
