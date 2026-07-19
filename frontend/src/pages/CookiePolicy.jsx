import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

const cookieTypes = [
  {
    name: 'Essential cookies',
    badge: 'Always on',
    description:
      'Required for the site to function — keeping you signed in, remembering what\'s in your cart, and processing your checkout securely. The site cannot work properly without these, so they cannot be switched off.',
  },
  {
    name: 'Preference cookies',
    badge: 'Optional',
    description:
      'Remember your settings — such as your delivery region and display preferences — so you don\'t have to set them again on every visit.',
  },
  {
    name: 'Analytics cookies',
    badge: 'Optional',
    description:
      'Help us understand how visitors use the site — which pages are most helpful and where people get stuck — so we can keep improving. This data is aggregated and is not used to identify you personally.',
  },
];

const CookiePolicy = () => {
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
            <Cookie className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-sm sm:text-base text-gray-500 mb-2">
            This policy explains what cookies are, which ones Capsandpills uses, and how you can
            control them.
          </p>
          <p className="text-xs sm:text-sm text-brand font-medium">Last updated: July 2026</p>
        </div>

        <div className="space-y-10">
          {/* What are cookies */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. What Are Cookies?</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They let
              the site remember information about your visit — like whether you're signed in or
              what's in your cart — so your experience stays smooth between pages and between
              visits. Similar technologies, such as local storage, work in much the same way and are
              covered by this policy too.
            </p>
          </section>

          {/* Cookies we use */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Cookies We Use</h2>
            <div className="space-y-4">
              {cookieTypes.map((type) => (
                <div key={type.name} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{type.name}</h3>
                    <span className="text-[11px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      {type.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{type.description}</p>
                </div>
              ))}
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-4">
              We do not use cookies to build advertising profiles, and we do not sell cookie data to
              third parties.
            </p>
          </section>

          {/* Managing cookies */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How to Control Cookies</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">
              You are in control. Most browsers let you view, block, or delete cookies through their
              settings:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-600 leading-relaxed">
              <li>Check your browser's privacy or security settings to block cookies from specific sites or all sites.</li>
              <li>Use private or incognito browsing to avoid storing cookies beyond your session.</li>
              <li>Clear your cookies at any time from your browser history settings.</li>
            </ul>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-3">
              Please note: if you block essential cookies, key features — including signing in,
              keeping items in your cart, and checking out — will not work properly.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Changes to This Policy</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in the cookies
              we use or in the law. Updates will be posted on this page with a revised "Last
              updated" date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Contact Us</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">
              Questions about how we use cookies? Reach us at:
            </p>
            <div className="bg-brand/10 rounded-xl p-4 sm:p-5 text-sm sm:text-base text-gray-600 space-y-1">
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
