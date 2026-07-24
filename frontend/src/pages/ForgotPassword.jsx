import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock3,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { authAPI } from "../api/index.js";
import logo from "../assets/logo.png";

const ForgotPassword = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const loginTarget = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (!resendCooldown) return undefined;
    const timer = setTimeout(
      () => setResendCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (data) => {
    try {
      setError("");
      setMessage("");
      await authAPI.forgotPassword(data);
      setSubmittedPhone(data.phone);
      setSent(true);
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset instructions");
    }
  };

  const handleResend = async () => {
    if (!submittedPhone || resendCooldown > 0) return;
    try {
      setError("");
      setMessage("");
      setResending(true);
      await authAPI.forgotPassword({ phone: submittedPhone });
      setMessage("New reset instructions have been requested.");
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend reset instructions");
    } finally {
      setResending(false);
    }
  };

  const changePhone = () => {
    setSent(false);
    setMessage("");
    setError("");
    setResendCooldown(0);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-white lg:flex lg:min-h-screen lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <img
              src={logo}
              alt="Caps and Pills"
              className="h-24 w-auto max-w-[280px] object-contain"
            />
            <div className="max-w-lg mx-auto">
              <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-pills-pink/10 text-pills-pink">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                Secure password recovery
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Enter your registered phone number to start secure account
                recovery.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <Clock3 className="h-5 w-5 text-pills-pink" />
                <p className="mt-3 text-sm font-bold text-slate-900">
                  Time-limited link
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Reset links expire automatically.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <Phone className="h-5 w-5 text-pills-pink" />
                <p className="mt-3 text-sm font-bold text-slate-900">
                  Phone number
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Use the number on your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <Link
              to={loginTarget}
              replace
              state={location.state}
              className="pressable mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-pills-pink"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <div className="border-b border-slate-100 bg-slate-50/70 px-7 py-5">
                <img
                  src={logo}
                  alt="Caps and Pills"
                  className="h-12 w-auto object-contain lg:hidden"
                />
                <p className="mt-4 text-sm font-semibold text-pills-pink lg:mt-0">
                  Account recovery
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {sent ? "Request received" : "Forgot password?"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {sent
                    ? "If this phone number exists in our system, password reset instructions will be sent."
                    : "Enter your account phone number to request password reset instructions."}
                </p>
              </div>

              <div className="p-7">
                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {message}
                  </div>
                )}

                {sent ? (
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Password reset instructions were requested for{" "}
                      <span className="font-bold text-slate-900">
                        {submittedPhone}
                      </span>
                      .
                    </p>
                    <div className="mt-6 space-y-3">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || resendCooldown > 0}
                        className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:border-pills-pink/30 hover:text-pills-pink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resending ? (
                          <span className="h-5 w-5 rounded-full border-2 border-pills-pink/25 border-t-pills-pink animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend reset link"}
                      </button>
                      <button
                        type="button"
                        onClick={changePhone}
                        className="pressable text-sm font-semibold text-pills-pink hover:text-pills-pink-dark"
                      >
                        Use a different phone number
                      </button>
                      <Link
                        to={loginTarget}
                        replace
                        state={location.state}
                        className="pressable block text-sm font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Back to Login
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                    noValidate
                  >
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Phone number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          {...register("phone", {
                            required: "Phone number is required",
                          })}
                          type="tel"
                          autoComplete="tel"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-pills-pink focus:bg-white focus:ring-4 focus:ring-pills-pink/10"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pills-pink text-sm font-bold text-white shadow-lg shadow-pills-pink/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pills-pink-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {isSubmitting ? (
                        <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          Send Reset Link <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;
