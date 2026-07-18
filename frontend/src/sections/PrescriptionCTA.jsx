import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ArrowRight, FileText, Shield, X, ClipboardCheck, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    number: "1",
    title: "Upload Prescription",
    desc: "Take a photo or upload a PDF of your doctor's prescription safely.",
    icon: Upload,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    number: "2",
    title: "Pharmacist Review",
    desc: "Our licensed pharmacists review your details and confirm the order.",
    icon: ClipboardCheck,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    number: "3",
    title: "Get Medicine Quote",
    desc: "Receive a transparent price quote and approve items you want.",
    icon: Shield,
    color: "bg-green-50 text-green-600 border-green-100",
  },
  {
    number: "4",
    title: "Express Delivery",
    desc: "Get your medicines delivered safely right to your door.",
    icon: Truck,
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
];

const PrescriptionCTA = () => {
  const navigate = useNavigate();
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  useEffect(() => {
    if (showHowItWorksModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showHowItWorksModal]);

  const handleUpload = () => {
    navigate('/prescriptions');
  };

  const handleHowItWorks = () => {
    setShowHowItWorksModal(true);
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-brand/5 to-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-5 sm:p-8 lg:p-12 shadow-sm"
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-medium mb-3 sm:mb-4">
                <FileText className="w-3.5 h-3.5" />
                Easy Prescription Upload
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Have a Prescription?
              </h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed sm:text-base sm:mb-6">
                Upload your prescription and our pharmacists will arrange everything for you. 
                Free home delivery on prescription orders.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button onClick={handleUpload} className="w-full sm:w-auto px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Prescription
                </button>
                <button onClick={handleHowItWorks} className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-200 hover:border-brand text-gray-700 hover:text-brand font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  How it Works <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100 sm:gap-4 sm:mt-6 sm:pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-brand" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Verified Pharmacists</span>
                </div>
              </div>
            </div>

            {/* Right - illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-to-br from-brand/10 to-brand/10 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-24 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center mx-auto mb-4 border-2 border-dashed border-brand/30">
                      <Upload className="w-8 h-8 text-brand mb-2" />
                      <span className="text-[10px] text-gray-400">Upload your prescription</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-2 -right-2 bg-white rounded-xl shadow-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="text-brand-teal w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Verified</p>
                      <p className="text-[10px] text-gray-500">By pharmacist</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showHowItWorksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowItWorksModal(false)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="absolute top-4 right-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-950">How Prescription Ordering Works</h3>
                <p className="text-sm text-gray-500 mt-1">Get your prescription medicines in 4 simple steps.</p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="flex gap-4 p-3 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <div className={`flex w-12 h-12 shrink-0 items-center justify-center rounded-xl border ${step.color}`}>
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-950">
                          <span className="text-brand mr-1">Step {step.number}:</span>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowHowItWorksModal(false)}
                  className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand/10 hover:shadow-brand/20 text-center text-sm"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PrescriptionCTA;
