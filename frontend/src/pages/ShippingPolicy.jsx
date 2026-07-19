import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const deliveryTimes = [
  { area: 'Metro Manila', time: '1–3 business days' },
  { area: 'Luzon (outside Metro Manila)', time: '2–5 business days' },
  { area: 'Visayas & Mindanao', time: '3–7 business days' },
];

const sections = [
  {
    title: '1. Shipping Fees',
    list: [
      'Free shipping on all orders above ₱500, anywhere in the Philippines.',
      'Orders below ₱500: a flat fee of ₱50 within Metro Manila and ₱90 for provincial addresses.',
      'Shipping fees, if any, are shown clearly at checkout before you pay.',
    ],
  },
  {
    title: '2. Coverage Area',
    content: [
      'We deliver nationwide across the Philippines — Metro Manila, Luzon, Visayas, and Mindanao — through our trusted courier partners. A few remote or hard-to-reach areas may have longer delivery times or limited service; if your address is affected, our team will contact you before dispatch.',
    ],
  },
  {
    title: '3. Delivery Timelines',
    content: [
      'Orders are processed after payment confirmation and, for prescription medicines, after pharmacist verification. Estimated delivery times from dispatch:',
    ],
    table: true,
    footer: 'Business days exclude weekends and Philippine public holidays. Timelines are estimates, not guarantees.',
  },
  {
    title: '4. Prescription Verification',
    content: [
      'Orders containing prescription (Rx) medicines are reviewed by our licensed pharmacists before dispatch. Verification typically adds up to 1 business day to processing time. If we need to confirm details with you or your doctor, we will reach out via your registered contact information.',
    ],
  },
  {
    title: '5. Temperature-Sensitive Items',
    content: [
      'Refrigerated and temperature-sensitive products (such as certain insulins, vaccines, and probiotics) are packed with insulated packaging and cold packs where needed. Please bring these items to proper storage as soon as they arrive, and inspect them upon delivery — temperature-sensitive items cannot be returned once accepted.',
    ],
  },
  {
    title: '6. Order Tracking',
    content: [
      'Once your order is dispatched, you can follow its status from the My Orders page in your account. Tracking updates are provided as the courier scans your package at each stage of the journey.',
    ],
  },
  {
    title: '7. Delays & Weather',
    content: [
      'The Philippines is no stranger to typhoons, flooding, and heavy weather. During severe conditions, courier operations may be suspended for safety, and deliveries to affected areas may be delayed. We will always prioritize the safety of riders and the integrity of your medicines, and we will keep you informed of significant delays.',
    ],
  },
  {
    title: '8. Undelivered Packages',
    list: [
      'Couriers typically attempt delivery up to two times. Please ensure someone is available to receive the package, especially for prescription and temperature-sensitive orders.',
      'If delivery fails repeatedly, the package is returned to us and we will contact you to arrange re-shipping or a refund (shipping fees for re-delivery may apply if the failure was due to an incorrect or incomplete address).',
      'Please double-check your delivery address and contact number at checkout — address changes after dispatch may not be possible.',
    ],
  },
  {
    title: '9. Damaged or Lost Shipments',
    content: [
      'If your package arrives visibly damaged, take photos before opening and report it to us within 48 hours. If your order is lost in transit, we will replace it or issue a full refund after confirmation with the courier. See our Refund & Returns Policy for full details.',
    ],
  },
  {
    title: '10. Contact Us',
    text: 'Questions about your delivery? Reach out with your order number:',
    contact: true,
  },
];

const ShippingPolicy = () => {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Shipping Policy</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-2">
          Everything you need to know about how we get your order to your doorstep.
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
              {section.table && (
                <div className="overflow-hidden border border-gray-200 rounded-xl mb-3">
                  <table className="w-full text-sm sm:text-base">
                    <thead>
                      <tr className="bg-brand/10">
                        <th className="text-left font-semibold text-gray-900 px-4 py-2.5">Destination</th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-2.5">Estimated Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryTimes.map((row) => (
                        <tr key={row.area} className="border-t border-gray-200">
                          <td className="text-gray-600 px-4 py-2.5">{row.area}</td>
                          <td className="text-gray-900 font-medium px-4 py-2.5">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

export default ShippingPolicy;
