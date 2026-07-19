import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Return Window',
    content: [
      'You may request a return or replacement within 7 days of receiving your order. Requests made after this period may not be accommodated, except where required by law.',
    ],
  },
  {
    title: '2. Eligible Items',
    text: 'We will gladly replace or refund items that are:',
    list: [
      'Damaged or broken during transit (e.g., crushed boxes, broken bottles, leaking containers).',
      'Defective or not functioning as intended.',
      'Incorrect — you received a different product, brand, strength, or quantity than what you ordered.',
      'Expired or near-expiry upon arrival, when a longer shelf life was reasonably expected.',
    ],
    footer: 'Please report these issues as soon as possible, ideally within 48 hours of delivery, and keep the item and its packaging for inspection.',
  },
  {
    title: '3. Non-Returnable Items',
    text: 'For your safety and in line with standard pharmacy practice and Philippine regulations, the following cannot be returned:',
    list: [
      'Medicines that have been opened, unsealed, or partially used.',
      'Refrigerated or temperature-sensitive items once delivered and accepted.',
      'Prescription (Rx) medicines that were correctly dispensed against your prescription — returns are accepted only if we made an error or the item arrived damaged or expired.',
      'Personal care and hygiene items that have been opened, for sanitary reasons.',
      'Items marked as final sale or non-returnable on the product page.',
    ],
  },
  {
    title: '4. How to Request a Return or Refund',
    list: [
      'Email us at support@capsandpills.com with your order number in the subject line.',
      'Briefly describe the issue and attach clear photos of the item, its packaging, and the delivery receipt if available.',
      'Our support team will review your request within 1–2 business days and confirm the next steps — replacement, refund, or return pickup where applicable.',
      'If a return pickup is needed, we will coordinate with our courier partner; do not ship items back on your own unless instructed.',
    ],
  },
  {
    title: '5. Replacement Option',
    content: [
      'For damaged, defective, wrong, or expired items, we offer a free replacement shipped to you at no extra cost, subject to stock availability. If the item is no longer available, a full refund will be issued instead.',
    ],
  },
  {
    title: '6. Refund Process & Timelines',
    list: [
      'Once your refund is approved, it is processed to your original payment method (GCash, Maya, card, etc.).',
      'Refunds are typically credited within 5–10 business days, depending on your payment provider or bank.',
      'Shipping fees are refunded when the return is due to our error (damaged, wrong, defective, or expired item).',
      'For cash-on-delivery orders, refunds are issued via GCash, Maya, or bank transfer — our team will confirm your preferred channel.',
    ],
  },
  {
    title: '7. Cancellations',
    content: [
      'You may cancel an order free of charge before it is dispatched. Once an order has been shipped — especially prescription medicines already verified and packed — cancellation may no longer be possible, and the return policy above will apply instead.',
    ],
  },
  {
    title: '8. Contact Us',
    text: 'For any return or refund concern, reach out with your order number:',
    contact: true,
  },
];

const RefundPolicy = () => {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Refund &amp; Returns Policy</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-2">
          We want you to shop with confidence. If something goes wrong with your order, we'll make it right.
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
              {section.footer && (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-3">
                  {section.footer}
                </p>
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

export default RefundPolicy;
