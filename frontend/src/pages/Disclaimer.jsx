import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const sections = [
  {
    title: '1. Not Medical Advice',
    content: [
      'The content on Capsandpills — including product descriptions, blog articles, health guides, and FAQs — is provided for general informational purposes only. It is not medical advice, and it should never be used as a substitute for professional diagnosis, treatment, or guidance from a qualified physician or other licensed healthcare provider.',
    ],
  },
  {
    title: '2. Always Consult a Physician',
    content: [
      'Never disregard professional medical advice or delay seeking it because of something you read on this site. Your doctor knows your medical history, current medications, allergies, and conditions — information that generic content cannot account for. Always consult your physician before starting, stopping, or changing any medication or treatment.',
    ],
  },
  {
    title: '3. Pharmacist Verification',
    content: [
      'All prescription (Rx) medicine orders on Capsandpills are reviewed and verified by our licensed pharmacists before dispensing, in line with Philippine law and FDA Philippines regulations. This verification is a safety check on your order — it does not replace your doctor\'s clinical judgment, diagnosis, or treatment plan.',
    ],
  },
  {
    title: '4. Product Information',
    content: [
      'Product details, images, dosages, and indications shown on the site are based on manufacturer information and are provided for reference. Manufacturers may update formulations, packaging, or instructions without notice. Always read the label, leaflet, and packaging of the actual product you receive before use, and follow your doctor\'s or pharmacist\'s directions.',
    ],
  },
  {
    title: '5. Emergencies',
    content: [
      'This site is not for medical emergencies. If you or someone else is experiencing severe symptoms — such as difficulty breathing, chest pain, loss of consciousness, severe allergic reaction, or suspected poisoning — call the Philippine emergency hotline 911 immediately or go to the nearest hospital emergency room. Do not wait for an online response.',
    ],
  },
  {
    title: '6. Limitation of Liability',
    content: [
      'While we work hard to keep our content accurate and up to date, Capsandpills makes no warranties about the completeness or accuracy of the information on this site. To the fullest extent permitted by law, we are not liable for any outcome arising from reliance on site content or from the misuse of products purchased. Your use of the site is also governed by our Terms of Service.',
    ],
  },
  {
    title: '7. Contact Us',
    text: 'Questions or concerns about this Disclaimer? Reach us at:',
    contact: true,
  },
];

const Disclaimer = () => {
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
        <div className="mb-10">
          <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Medical Disclaimer</h1>
          <p className="text-sm sm:text-base text-gray-500 mb-2">
            Please read this disclaimer carefully before relying on any content on Capsandpills.
          </p>
          <p className="text-xs sm:text-sm text-brand font-medium">Last updated: July 2026</p>
        </div>

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

export default Disclaimer;
