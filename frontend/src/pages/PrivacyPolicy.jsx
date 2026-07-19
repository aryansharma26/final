import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Account information',
        text: 'When you create an account, we collect your name, email address, mobile number, delivery addresses, and password (stored only in encrypted form).',
      },
      {
        subtitle: 'Order information',
        text: 'We collect details of the products you purchase, order history, delivery instructions, and any communications related to your orders.',
      },
      {
        subtitle: 'Prescription and health data',
        text: 'When you upload a prescription or book a doctor consultation, we collect the prescription image or file and related health information you choose to share. This is treated as sensitive personal information under Philippine law.',
      },
      {
        subtitle: 'Payment information',
        text: 'Payments are processed by our accredited payment partners (such as GCash and Maya). We do not store your full card or wallet credentials on our servers — only transaction references needed to confirm and reconcile your payment.',
      },
      {
        subtitle: 'Usage data',
        text: 'We automatically collect device information, browser type, IP address, and pages visited to keep the site secure and improve your experience.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    list: [
      'Process and deliver your orders, including pharmacist verification of prescription medicines.',
      'Manage your account, order history, wishlist, and saved addresses.',
      'Facilitate doctor consultations you book through the platform.',
      'Send order confirmations, delivery updates, and important service notices.',
      'Improve our catalog, website performance, and customer support.',
      'Comply with legal and regulatory obligations, including FDA Philippines requirements for prescription medicine sales.',
      'With your consent, send promotions and offers — you may opt out at any time.',
    ],
  },
  {
    title: '3. Confidentiality of Prescription & Health Data',
    content: [
      {
        text: 'Prescriptions and health information are accessed only by authorized personnel — licensed pharmacists for verification, and the doctors you consult. We never sell your health data, and we never use it for advertising. Access is logged, and files are stored with strict access controls.',
      },
    ],
  },
  {
    title: '4. How We Share Your Information',
    text: 'We share your information only when necessary, and only with:',
    list: [
      'Delivery couriers — your name, address, and contact number, solely to deliver your order.',
      'Payment processors — transaction details needed to complete your payment securely.',
      'Regulators and authorities — such as the FDA Philippines or other government bodies, when required by law or lawful order.',
      'Service providers — hosting, analytics, and customer support tools bound by confidentiality obligations.',
    ],
    footer: 'We do not sell, rent, or trade your personal information to third parties.',
  },
  {
    title: '5. Cookies',
    content: [
      {
        text: 'We use cookies and similar technologies to keep you signed in, remember your cart, and understand how the site is used. You can disable cookies in your browser settings, but some features — such as checkout — may not work properly without them.',
      },
    ],
  },
  {
    title: '6. Data Retention',
    content: [
      {
        text: 'We retain your account and order information for as long as your account is active and as required by Philippine law and pharmacy regulations. Prescription records are kept for the retention periods mandated for pharmacies. When data is no longer needed, it is securely deleted or anonymized.',
      },
    ],
  },
  {
    title: '7. Your Rights',
    text: 'Under the Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to:',
    list: [
      'Be informed about how your personal data is collected and used.',
      'Access the personal data we hold about you.',
      'Correct inaccurate or incomplete personal data.',
      'Request deletion or blocking of your data, subject to legal retention requirements.',
      'Object to processing for direct marketing purposes.',
      'File a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated.',
    ],
    footer: 'To exercise any of these rights, contact us using the details below.',
  },
  {
    title: '8. Data Security',
    content: [
      {
        text: 'We use encryption in transit, secure servers, and role-based access controls to protect your information. While no system is perfectly secure, we continuously review our safeguards to keep your data safe.',
      },
    ],
  },
  {
    title: '9. Changes to This Policy',
    content: [
      {
        text: 'We may update this Privacy Policy from time to time. Material changes will be announced on this page with an updated date. Continued use of the site after changes take effect means you accept the revised policy.',
      },
    ],
  },
  {
    title: '10. Contact Us',
    text: 'For privacy questions, requests, or concerns, reach our Data Privacy team at:',
    contact: true,
  },
];

const PrivacyPolicy = () => {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-2">
          Capsandpills respects your privacy and complies with the{' '}
          <span className="text-gray-900 font-medium">Data Privacy Act of 2012 (RA 10173)</span> and
          the rules of the National Privacy Commission (NPC).
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
              {section.content?.map((block, i) => (
                <div key={i} className="mb-3">
                  {block.subtitle && (
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                      {block.subtitle}
                    </h3>
                  )}
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{block.text}</p>
                </div>
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

export default PrivacyPolicy;
