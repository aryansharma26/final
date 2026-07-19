import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Clock, HelpCircle } from 'lucide-react';

const contactMethods = [
  {
    icon: Phone,
    title: 'Phone',
    value: '+63 2 8123 4567',
    note: 'For urgent order and prescription concerns',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'support@capsandpills.com',
    note: 'We reply within 1 business day',
  },
  {
    icon: MapPin,
    title: 'Address',
    value: 'Las Piñas, Philippines',
    note: 'Our pharmacy and fulfillment center',
  },
];

const ContactUs = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Questions about an order, a prescription, or a product? Our support team is here to
            help — in English or Filipino.
          </p>
        </div>

        {/* Contact methods */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {contactMethods.map((method) => (
            <div key={method.title} className="border border-gray-200 rounded-xl p-5">
              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
                <method.icon className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{method.title}</h2>
              <p className="text-sm text-brand font-medium mb-1">{method.value}</p>
              <p className="text-xs text-gray-500">{method.note}</p>
            </div>
          ))}
        </div>

        {/* Support hours */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Support Hours</h2>
          <div className="border border-gray-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
              <Clock className="w-4 h-4 text-brand shrink-0" />
              <span>Monday to Saturday: 8:00 AM – 8:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
              <Clock className="w-4 h-4 text-brand shrink-0" />
              <span>Sundays and public holidays: 9:00 AM – 5:00 PM</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Emails sent outside support hours are answered first thing the next business day.
            </p>
          </div>
        </div>

        {/* FAQ link */}
        <div className="bg-brand/10 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-5 h-5 text-brand" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Looking for a quick answer?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-5">
            Many common questions about orders, shipping, prescriptions, and returns are answered on
            our Help Center page.
          </p>
          <Link
            to="/faq"
            className="pressable inline-flex items-center justify-center bg-brand text-white text-sm sm:text-base font-medium px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
          >
            Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
