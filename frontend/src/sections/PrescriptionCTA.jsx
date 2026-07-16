import { motion } from 'framer-motion';
import { Upload, ArrowRight, FileText, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrescriptionCTA = () => {
  const navigate = useNavigate();

  const handleUpload = () => {
    navigate('/prescriptions');
  };

  const handleHowItWorks = () => {
    alert('Prescription Upload Process:\n\n1. Upload your prescription\n2. Our pharmacist reviews it\n3. We arrange your medicines\n4. Free home delivery');
  };

  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-brand/5 to-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-medium mb-4">
                <FileText className="w-3.5 h-3.5" />
                Easy Prescription Upload
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Have a Prescription?
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
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
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
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
    </section>
  );
};

export default PrescriptionCTA;
