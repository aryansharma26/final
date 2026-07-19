import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, UserCheck, Clock, Video, FileText, HeartPulse, Brain, Baby, ShieldCheck, BadgeCheck } from 'lucide-react';

const steps = [
  {
    icon: UserCheck,
    title: 'Choose your doctor',
    description:
      'Browse PRC-licensed Filipino doctors by specialty, location, and teleconsultation availability — all verified by our team.',
  },
  {
    icon: Clock,
    title: 'Book a time slot',
    description:
      'Pick a schedule that fits your day. No travel, no waiting rooms, no half-day queues at the clinic.',
  },
  {
    icon: Video,
    title: 'Consult online',
    description:
      'Meet your doctor through a secure video or chat consultation — from home, the office, or anywhere in the Philippines.',
  },
  {
    icon: FileText,
    title: 'Get your e-prescription',
    description:
      'When medically appropriate, your doctor issues an e-prescription you can use to order medicines on Capsandpills for delivery to your doorstep.',
  },
];

const whoItsFor = [
  {
    icon: Stethoscope,
    title: 'Common illnesses',
    description:
      'Colds, flu, fever, cough, allergies, skin concerns, stomach issues — get advice and treatment without leaving home.',
  },
  {
    icon: HeartPulse,
    title: 'Chronic care follow-ups',
    description:
      'Regular check-ins for hypertension, diabetes, asthma, and other long-term conditions, with prescriptions renewed as needed.',
  },
  {
    icon: Brain,
    title: 'Mental wellness',
    description:
      'A private, judgment-free space to talk about stress, anxiety, sleep problems, and burnout — and get professional guidance.',
  },
  {
    icon: Baby,
    title: 'Pediatric advice',
    description:
      'Quick answers for worried parents: fevers, rashes, feeding concerns, and knowing when a child needs to be seen in person.',
  },
];

const DoctorConsultation = () => {
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
            <Stethoscope className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Online Doctor Consultation</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Talk to a licensed Filipino doctor without leaving your home. Capsandpills connects you
            with verified physicians for secure video or chat consultations — and when you need
            medication, your e-prescription flows straight into your medicine order, verified by our
            pharmacists and delivered to your door.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">How It Works</h2>
          <ol className="space-y-4">
            {steps.map((step, index) => (
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

        {/* What's included */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">What's Included</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <span className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Consultations with PRC-licensed Filipino doctors, verified and vetted before joining
                the platform.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <span className="text-sm sm:text-base text-gray-600 leading-relaxed">
                An e-prescription when medically appropriate — usable directly on Capsandpills, with
                pharmacist verification on every Rx order.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <span className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Follow-up guidance after your consultation, so you know exactly what to do next.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <span className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Referral to diagnostic tests when needed — book them through our{' '}
                <Link to="/lab-tests" className="pressable text-brand hover:text-brand-dark transition-colors">
                  Lab Tests
                </Link>{' '}
                service with home sample collection.
              </span>
            </li>
          </ul>
        </div>

        {/* Who it's for */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Who It's For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {whoItsFor.map((item) => (
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

        {/* Reassurance */}
        <div className="mb-12 sm:mb-16 bg-brand/10 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-brand" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Private, Safe, and Compliant</h2>
          </div>
          <div className="space-y-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            <p>
              Your consultations are confidential. Health information you share is accessible only
              to your doctor and authorized pharmacy staff, and is protected under the Data Privacy
              Act of 2012.
            </p>
            <p>
              E-prescriptions issued through consultations are handled in line with FDA Philippines
              regulations — prescription medicines are dispensed only after review by our licensed
              pharmacists. Online consultations complement, but do not replace, in-person medical
              care where a physical examination is needed.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Ready to talk to a doctor?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-5">
            Browse our verified doctors and book your first consultation today.
          </p>
          <Link
            to="/doctors"
            className="pressable inline-flex items-center justify-center bg-brand text-white text-sm sm:text-base font-medium px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
          >
            Find a Doctor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultation;
