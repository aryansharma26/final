import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Stethoscope, Building2, Truck, BadgeCheck, Mail } from 'lucide-react';

const partnershipTypes = [
  {
    icon: Package,
    title: 'Pharmacy Suppliers & Distributors',
    description:
      'Licensed pharmaceutical distributors and manufacturers who want their products reaching customers nationwide through a compliant, FDA-registered online channel.',
  },
  {
    icon: Stethoscope,
    title: 'Healthcare Providers',
    description:
      'Doctors, clinics, and telehealth providers who want to offer patients a seamless way to fill prescriptions after every consultation.',
  },
  {
    icon: Building2,
    title: 'Corporate & B2B Partners',
    description:
      'Companies looking to provide medicine benefits, wellness packages, or bulk healthcare supplies for their employees.',
  },
  {
    icon: Truck,
    title: 'Delivery & Logistics Partners',
    description:
      'Couriers and last-mile delivery providers with the reliability — and, where needed, the cold-chain capability — that medicines demand.',
  },
];

const benefits = [
  'Access to a growing nationwide customer base across Metro Manila, Luzon, Visayas, and Mindanao.',
  'A compliant sales channel — every prescription order is verified by our licensed pharmacists.',
  'Transparent reporting on orders, deliveries, and product performance.',
  'Dedicated partner support from our team in Las Piñas.',
  'Batch and expiry tracking on every product, protecting your brand and your customers.',
];

const Partners = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Partner With Capsandpills</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            We believe better healthcare access is built together. Whether you supply medicines,
            provide care, employ teams that need wellness support, or deliver packages across the
            Philippines — let's explore how we can work with you.
          </p>
        </div>

        {/* Partnership types */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Partnership Opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {partnershipTypes.map((item) => (
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

        {/* Benefits */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Why Partner With Us</h2>
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-brand/10 rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Let's build healthier communities together
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-5">
            Tell us about your business and the partnership you have in mind.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/b2b-enquiry"
              className="pressable inline-flex items-center justify-center bg-brand text-white text-sm sm:text-base font-medium px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Send a B2B Enquiry
            </Link>
            <a
              href="mailto:partners@capsandpills.com"
              className="pressable inline-flex items-center gap-2 text-sm sm:text-base text-brand font-medium hover:text-brand-dark transition-colors"
            >
              <Mail className="w-4 h-4" />
              partners@capsandpills.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;
