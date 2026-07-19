import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Users, TrendingUp, GraduationCap, MapPin, Clock, Mail } from 'lucide-react';

const culturePoints = [
  {
    icon: Heart,
    title: 'Purpose-driven work',
    description:
      'Every order you help fulfill puts genuine, verified medicine in the hands of a Filipino family. What you do here matters every single day.',
  },
  {
    icon: Users,
    title: 'Collaborative team',
    description:
      'Work side by side with licensed pharmacists, engineers, logistics specialists, and support agents who share knowledge openly and help each other grow.',
  },
  {
    icon: TrendingUp,
    title: 'Grow with us',
    description:
      'We are a young company expanding nationwide. Early team members take on real responsibility and grow their careers as we scale.',
  },
  {
    icon: GraduationCap,
    title: 'Continuous learning',
    description:
      'From FDA Philippines pharmacy regulations to modern e-commerce technology, we invest in training, certifications, and mentorship for every role.',
  },
];

const openRoles = [
  {
    title: 'Licensed Pharmacist',
    team: 'Pharmacy Operations',
    location: 'Las Piñas, Metro Manila',
    type: 'Full-time',
    description:
      'Verify prescriptions, counsel customers on proper medication use, and ensure every dispensed order meets FDA Philippines requirements.',
  },
  {
    title: 'Pharmacy Assistant',
    team: 'Pharmacy Operations',
    location: 'Las Piñas, Metro Manila',
    type: 'Full-time',
    description:
      'Support our pharmacists in picking, packing, and double-checking orders — including batch number and expiry date verification.',
  },
  {
    title: 'Customer Support Specialist',
    team: 'Customer Experience',
    location: 'Remote (Philippines)',
    type: 'Full-time',
    description:
      'Help customers with orders, deliveries, prescriptions, and product questions across chat, email, and phone — in English or Filipino.',
  },
  {
    title: 'Delivery Operations Coordinator',
    team: 'Logistics',
    location: 'Las Piñas, Metro Manila',
    type: 'Full-time',
    description:
      'Coordinate with courier partners, monitor nationwide deliveries, and make sure every package — especially temperature-sensitive ones — arrives on time.',
  },
  {
    title: 'Software Engineer (Full-Stack)',
    team: 'Technology',
    location: 'Hybrid — Las Piñas / Remote',
    type: 'Full-time',
    description:
      'Build and improve our React and Node.js platform — from checkout and prescription uploads to doctor consultations and delivery tracking.',
  },
];

const Careers = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Careers at Capsandpills</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            We're building the Philippines' most trusted online pharmacy — and we're looking for
            people who care about healthcare, honesty, and great service. Whether you're a licensed
            pharmacist, a software engineer, or a customer support champion, there's a place for you
            on our team in Las Piñas.
          </p>
        </div>

        {/* Why work here */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Why Work With Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {culturePoints.map((item) => (
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

        {/* Open roles */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Open Roles</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6">
            These are sample openings that reflect the kind of roles we hire for. Actual vacancies may vary.
          </p>
          <div className="space-y-4">
            {openRoles.map((role) => (
              <div key={role.title} className="border border-gray-200 rounded-xl p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">{role.title}</h3>
                  <span className="text-[11px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                    {role.team}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {role.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {role.type}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How to apply */}
        <div className="bg-brand/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">How to Apply</h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
            Send your resume and a short note about why you'd like to join us. If you're applying for
            a pharmacist position, please include your PRC license number. We review every
            application and reply within 5 business days.
          </p>
          <a
            href="mailto:careers@capsandpills.com"
            className="pressable inline-flex items-center gap-2 text-sm sm:text-base text-brand font-medium hover:text-brand-dark transition-colors"
          >
            <Mail className="w-4 h-4" />
            careers@capsandpills.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default Careers;
