import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using Capsandpills ("the Site"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Site. We may update these terms from time to time; continued use after changes take effect constitutes acceptance.',
    ],
  },
  {
    title: '2. Account Responsibilities',
    list: [
      'You must provide accurate, current, and complete information when creating an account.',
      'You are responsible for keeping your password confidential and for all activity under your account.',
      'You must be at least 18 years old to create an account and place orders.',
      'Notify us immediately at support@capsandpills.com if you suspect unauthorized use of your account.',
    ],
  },
  {
    title: '3. Prescription Medicines',
    content: [
      'Medicines marked as prescription-required (Rx) are dispensed strictly in accordance with Philippine law and FDA Philippines regulations.',
    ],
    list: [
      'A valid prescription issued by a licensed physician is required for all Rx medicines.',
      'Every prescription is reviewed and verified by our licensed pharmacists before the order is confirmed.',
      'We reserve the right to refuse or cancel any order if the prescription is invalid, expired, altered, illegible, or raises safety concerns.',
      'Prescriptions may be re-validated for repeat orders to ensure continued safety and compliance.',
      'Online consultations, where available, are provided by independently licensed doctors and do not replace in-person medical care where needed.',
    ],
  },
  {
    title: '4. Regulatory Compliance',
    content: [
      'Capsandpills operates in compliance with the Philippine Food and Drug Administration (FDA) and applicable pharmacy laws. All products sold are sourced from licensed suppliers and tracked by batch number and expiry date. Restricted items — including certain prescription, habit-forming, or age-restricted products — will not be sold to minors, and we may request proof of identity or age before completing such orders.',
    ],
  },
  {
    title: '5. Orders, Pricing & Availability',
    list: [
      'All prices are in Philippine Pesos (₱) and include applicable taxes unless stated otherwise.',
      'Prices and product availability may change without prior notice.',
      'Placing an order constitutes an offer to purchase; we may decline or cancel orders due to stock issues, pricing errors, or verification concerns, with a full refund of any payment made.',
      'Order confirmation is sent once payment and any required prescription verification are completed.',
    ],
  },
  {
    title: '6. Payment',
    content: [
      'We accept GCash, Maya, major cards, and other payment methods shown at checkout. Payments are processed securely by accredited payment partners. You authorize us to charge the payment method you provide for the total order amount, including shipping fees where applicable.',
    ],
  },
  {
    title: '7. Intellectual Property',
    content: [
      'All content on the Site — including the Capsandpills name and logo, text, graphics, and design — is owned by or licensed to us and protected by intellectual property laws. You may not copy, reproduce, or use any content for commercial purposes without our written consent. Third-party artwork is credited on our Credits page.',
    ],
  },
  {
    title: '8. Acceptable Use',
    list: [
      'Do not misuse the Site, attempt unauthorized access, or interfere with its operation.',
      'Do not upload fraudulent, forged, or another person\'s prescription.',
      'Do not use the Site for resale of prescription medicines or any unlawful purpose.',
      'We may suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    content: [
      'Product information on the Site is for general reference and is not a substitute for professional medical advice. Always consult a qualified physician or pharmacist about your condition and medications. To the fullest extent permitted by law, Capsandpills is not liable for indirect, incidental, or consequential damages arising from use of the Site or products purchased, and our total liability for any claim is limited to the amount you paid for the order concerned.',
    ],
  },
  {
    title: '10. Governing Law',
    content: [
      'These Terms are governed by the laws of the Republic of the Philippines. Any dispute arising from these Terms or your use of the Site shall be subject to the exclusive jurisdiction of the courts of the Philippines.',
    ],
  },
  {
    title: '11. Contact Us',
    text: 'Questions about these Terms? Reach us at:',
    contact: true,
  },
];

const Terms = () => {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-2">
          Please read these terms carefully before using Capsandpills.
        </p>
        <p className="text-xs sm:text-sm text-brand font-medium mb-10">Last updated: July 2026</p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
              {section.text && (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">
                  {section.text}
                </p>
              )}
              {section.content?.map((paragraph, i) => (
                <p key={i} className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.contact && (
                <div className="mt-3 bg-brand/10 rounded-xl p-4 sm:p-5 text-sm sm:text-base text-gray-600 space-y-1">
                  <p>
                    Email:{' '}
                    <a
                      href="mailto:support@capsandpills.com"
                      className="pressable text-brand hover:text-brand-dark transition-colors"
                    >
                      support@capsandpills.com
                    </a>
                  </p>
                  <p>Phone: +63 2 8123 4567</p>
                  <p>Address: Las Piñas, Philippines</p>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Terms;
