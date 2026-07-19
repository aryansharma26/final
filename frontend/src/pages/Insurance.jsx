import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CreditCard, FileText, Phone, Mail, Info } from 'lucide-react';

const reimbursementSteps = [
  {
    icon: CreditCard,
    title: 'Pay for your order first',
    description:
      'Complete your purchase using any of our payment methods. Keep your order confirmation and official receipt.',
  },
  {
    icon: FileText,
    title: 'Gather your documents',
    description:
      'Most HMOs require the official receipt, a copy of the doctor\'s prescription, and sometimes a claim form. We provide itemized receipts suitable for filing.',
  },
  {
    icon: ShieldCheck,
    title: 'File your claim with your provider',
    description:
      'Submit the documents to your HMO or insurer according to their claims process. Reimbursement amounts and timelines depend on your plan\'s coverage.',
  },
];

const Insurance = () => {
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
            <ShieldCheck className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Insurance & HMO Coverage</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Many Filipinos have health coverage through an HMO or insurance plan — but using it for
            medicines isn't always straightforward. Here's where things stand with Capsandpills and
            how you can make the most of your coverage today.
          </p>
        </div>

        {/* Current status */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Working With Major Providers</h2>
          <div className="space-y-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            <p>
              We are actively pursuing accreditation with leading Philippine HMOs and insurance
              providers, including networks like{' '}
              <span className="text-gray-900 font-medium">Maxicare</span>,{' '}
              <span className="text-gray-900 font-medium">Intellicare</span>, and other major
              health plan administrators. Our goal is direct billing — where your plan pays for
              eligible medicines at checkout, so you don't have to pay out of pocket.
            </p>
            <p>
              In the meantime, many members use the{' '}
              <span className="text-gray-900 font-medium">reimbursement route</span>: you pay first,
              then file a claim with your provider using our itemized official receipts.
            </p>
          </div>
        </div>

        {/* How reimbursement works */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">How Reimbursement Works</h2>
          <ol className="space-y-4">
            {reimbursementSteps.map((step, index) => (
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

        {/* PhilHealth note */}
        <div className="mb-12 sm:mb-16 bg-brand/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">A Note on PhilHealth</h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            PhilHealth coverage for outpatient medicines is currently limited to specific programs
            (such as the Konsulta outpatient package through accredited providers). Capsandpills
            orders are generally not covered by PhilHealth at this time, but we're monitoring
            program expansions closely and will update this page as coverage options grow.
          </p>
        </div>

        {/* Tips */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Tips Before You File a Claim</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-600 leading-relaxed">
            <li>Check your plan's outpatient medicine benefit — coverage varies widely between HMO plans.</li>
            <li>Make sure your prescription is complete, signed, and within its validity period.</li>
            <li>Ask your provider whether generic medicines are reimbursed at the same rate as branded ones.</li>
            <li>File claims promptly — most providers have submission deadlines of 30 to 90 days.</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="border border-gray-200 rounded-xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div>
            <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              Questions about insurance?
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">
              If you're unsure whether your plan covers a purchase, or you need specific documents
              for a claim, our support team can help prepare what you need.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs sm:text-sm">
              <a
                href="mailto:support@capsandpills.com"
                className="pressable inline-flex items-center gap-1.5 text-brand hover:text-brand-dark transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                support@capsandpills.com
              </a>
              <span className="inline-flex items-center gap-1.5 text-gray-600">
                <Phone className="w-3.5 h-3.5" />
                +63 2 8123 4567
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insurance;
