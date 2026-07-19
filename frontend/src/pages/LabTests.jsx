import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, ClipboardList, Clock, Home, FileText, Info } from 'lucide-react';

const testCategories = [
  {
    name: 'Complete Blood Count (CBC)',
    description: 'Checks red and white blood cells, hemoglobin, and platelets — a common baseline test for infections, anemia, and overall health.',
    price: '₱350',
  },
  {
    name: 'Urinalysis',
    description: 'Screens for urinary tract infections, kidney issues, and diabetes markers through a simple urine sample.',
    price: '₱250',
  },
  {
    name: 'Fasting Blood Sugar (FBS)',
    description: 'Measures blood glucose after an 8–12 hour fast. A standard test for diabetes screening and monitoring.',
    price: '₱300',
  },
  {
    name: 'Lipid Profile',
    description: 'Measures total cholesterol, HDL, LDL, and triglycerides to assess heart disease risk. Requires fasting.',
    price: '₱950',
  },
  {
    name: 'HbA1c (Glycated Hemoglobin)',
    description: 'Shows your average blood sugar over the past 2–3 months — the key test for managing diabetes. No fasting needed.',
    price: '₱850',
  },
  {
    name: 'Thyroid Stimulating Hormone (TSH)',
    description: 'Screens for hypothyroidism and hyperthyroidism — common causes of unexplained fatigue and weight changes.',
    price: '₱1,100',
  },
];

const bookingSteps = [
  {
    icon: ClipboardList,
    title: 'Choose your tests',
    description: 'Browse available tests and pick what you need — or what your doctor requested.',
  },
  {
    icon: Clock,
    title: 'Book a time slot',
    description: 'Select a schedule that works for you, including morning slots for fasting tests.',
  },
  {
    icon: Home,
    title: 'Home sample collection',
    description: 'A trained medical technologist visits your home to collect samples — no need to travel or queue.',
  },
  {
    icon: FileText,
    title: 'Get your results',
    description: 'Results are delivered securely to your email and account, typically within 24–48 hours.',
  },
];

const LabTests = () => {
  const navigate = useNavigate();
  return (
    <div className="container-custom py-10 sm:py-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="pressable inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-12 sm:mb-16">
          <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
            <FlaskConical className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Lab Tests at Home</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Skip the long lines at the laboratory. With Capsandpills, you can book essential
            diagnostic tests and have samples collected right at your doorstep — processed by
            licensed laboratories, reviewed by medical technologists, and delivered to you securely.
          </p>
        </div>

        {/* Test catalog */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Popular Tests</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6">
            Indicative starting prices in Metro Manila. Final pricing may vary by location and package.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {testCategories.map((test) => (
              <div key={test.name} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">{test.name}</h3>
                  <span className="text-sm font-semibold text-brand shrink-0">{test.price}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{test.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How booking works */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">How Booking Works</h2>
          <ol className="space-y-4">
            {bookingSteps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-brand" />
                </div>
                <div className="pt-1.5">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {index + 1}. {step.title}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Home collection note */}
        <div className="mb-12 sm:mb-16 bg-brand/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Home Sample Collection</h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Home collection is currently available across Metro Manila, with expansion to nearby
            provinces underway. Samples are handled under strict chain-of-custody procedures and
            transported to partner laboratories under proper temperature conditions.
          </p>
        </div>

        {/* Coming soon note */}
        <div className="border border-gray-200 rounded-xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div>
            <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              Full online booking is coming soon
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We're finalizing partnerships with licensed diagnostic laboratories. To register your
              interest or ask about availability in your area, email us at{' '}
              <a
                href="mailto:support@capsandpills.com"
                className="pressable text-brand hover:text-brand-dark transition-colors"
              >
                support@capsandpills.com
              </a>{' '}
              or call +63 2 8123 4567.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabTests;
