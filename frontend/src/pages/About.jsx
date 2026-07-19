import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Stethoscope, Truck, BadgeCheck, Search, FileUp, CreditCard, PackageCheck } from 'lucide-react';

const differentiators = [
  {
    icon: BadgeCheck,
    title: '100% Genuine Products',
    description:
      'Every medicine and healthcare product we sell is sourced directly from licensed distributors and manufacturers, with batch numbers and expiry dates tracked.',
  },
  {
    icon: Shield,
    title: 'Licensed Pharmacists',
    description:
      'Our registered pharmacists verify every prescription order before it is dispensed, so you get the right medicine at the right dose, every time.',
  },
  {
    icon: Stethoscope,
    title: 'Doctor Consultations',
    description:
      'Book an online consultation with licensed Filipino doctors from the comfort of your home — no long queues, no travel, just real medical advice.',
  },
  {
    icon: Truck,
    title: 'Fast Nationwide Delivery',
    description:
      'From Metro Manila to Mindanao, we deliver to your doorstep. Enjoy free shipping on orders above ₱500, anywhere in the Philippines.',
  },
];

const steps = [
  {
    icon: Search,
    title: 'Browse & search',
    description: 'Explore thousands of genuine medicines, vitamins, and wellness products.',
  },
  {
    icon: FileUp,
    title: 'Upload prescription',
    description: 'For Rx medicines, upload a clear photo of your valid prescription for pharmacist verification.',
  },
  {
    icon: CreditCard,
    title: 'Secure checkout',
    description: 'Pay safely with GCash, Maya, cards, or cash on delivery.',
  },
  {
    icon: PackageCheck,
    title: 'Doorstep delivery',
    description: 'Track your order until it arrives — sealed, verified, and handled with care.',
  },
];

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="container-custom py-10 sm:py-16">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="pressable inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Your Trusted Online Pharmacy in the Philippines
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Capsandpills was founded with a simple belief: every Filipino deserves easy access to
          genuine, affordable medicines — without the long lines, the traffic, or the doubt about
          whether what they're buying is real. From our home in Las Piñas, we deliver certified
          medicines, healthcare essentials, and wellness products to doorsteps across the country.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="bg-brand/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Our Mission</h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            To make quality healthcare accessible to every Filipino family by combining the
            convenience of e-commerce with the care and rigor of a licensed pharmacy — genuine
            products, professional guidance, and honest prices, delivered nationwide.
          </p>
        </div>
      </div>

      {/* What makes us different */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">What Makes Us Different</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {differentiators.map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-xl p-5">
              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-brand" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">How It Works</h2>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-brand" />
                </div>
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

      {/* Trust & quality */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Quality You Can Trust</h2>
        <div className="space-y-3 text-sm sm:text-base text-gray-600 leading-relaxed">
          <p>
            We operate in compliance with the regulations of the{' '}
            <span className="text-gray-900 font-medium">Philippine Food and Drug Administration (FDA)</span>.
            All prescription medicines are dispensed only against a valid prescription and are
            verified by our licensed pharmacists before dispatch.
          </p>
          <p>
            Every product in our catalog is tracked by batch number and expiry date, stored under
            proper conditions, and packed with care — including insulated handling for
            temperature-sensitive items. If a product ever falls short of your expectations, our
            support team is one message away.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Ready to shop with confidence?
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-5">
          Browse our catalog of genuine medicines and wellness essentials today.
        </p>
        <Link
          to="/medicines"
          className="pressable inline-flex items-center justify-center bg-brand text-white text-sm sm:text-base font-medium px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
};

export default About;
