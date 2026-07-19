import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Package, ClipboardList, Syringe, BadgeCheck } from 'lucide-react';

const programs = [
  {
    icon: HeartPulse,
    title: 'Employee Medicine Benefits',
    description:
      'Give your team prepaid medicine credits or subsidized allowances they can use on our full catalog — prescription medicines included, with pharmacist verification built in.',
  },
  {
    icon: Package,
    title: 'Bulk & Corporate Ordering',
    description:
      'Order first-aid kits, office medicine cabinets, vitamins, and healthcare supplies in bulk at corporate rates, delivered to one site or distributed to multiple offices.',
  },
  {
    icon: ClipboardList,
    title: 'Employee Health Packages',
    description:
      'Annual physical exam bundles and preventive health packages combining lab tests, doctor consultations, and essential medicines — customized to your workforce.',
  },
  {
    icon: Syringe,
    title: 'Vaccination Drives',
    description:
      'On-site flu and other vaccination programs coordinated with our partner healthcare providers, so your team gets protected without leaving the office.',
  },
];

const whyPoints = [
  'A single account manager for your company — one point of contact for orders, billing, and support.',
  'FDA Philippines-compliant sourcing on every product, with batch and expiry tracking.',
  'Nationwide delivery, so provincial teams get the same benefit as your head office.',
  'Flexible arrangements — from one-time bulk orders to ongoing monthly medicine benefits.',
];

const CorporateWellness = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Corporate Wellness Programs</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Healthy employees build healthy companies. Capsandpills partners with businesses of all
            sizes to deliver medicine benefits, health packages, and wellness programs that are easy
            to manage — and that your team will actually use.
          </p>
        </div>

        {/* Programs */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {programs.map((program) => (
              <div key={program.title} className="border border-gray-200 rounded-xl p-5">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
                  <program.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5">{program.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{program.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why us */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Why Companies Choose Us</h2>
          <ul className="space-y-3">
            {whyPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-brand/10 rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Ready to invest in your team's health?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-5">
            Tell us about your company size and what you're looking for — we'll put together a
            proposal within 3 business days.
          </p>
          <Link
            to="/b2b-enquiry"
            className="pressable inline-flex items-center justify-center bg-brand text-white text-sm sm:text-base font-medium px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
          >
            Send a B2B Enquiry
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CorporateWellness;
