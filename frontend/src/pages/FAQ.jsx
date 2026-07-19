import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Check, ChevronDown, ClipboardCheck, Copy, CreditCard, FileText, Mail, MessageCircle, Package, PackageCheck, Phone, RotateCcw, ShieldCheck, Stethoscope, Tag, Truck, UserCircle, X } from 'lucide-react';

const sections = [
  {
    id: 'rx-quote',
    icon: FileText,
    title: 'Prescription quote process',
    summary: 'Use this when you already have a prescription and want our team to prepare the right medicine quote.',
    questions: [
      {
        id: 'rx-upload',
        question: 'How does prescription upload work?',
        answer:
          'Upload a clear photo or PDF of your prescription and select your saved delivery address. The file stays linked to your account, so only you and the admin team can access it.',
      },
      {
        id: 'rx-review',
        question: 'What happens after I upload it?',
        answer:
          'Our team reviews the prescription first. If the medicine name, dose, quantity, or address needs confirmation, we call you before preparing the quote.',
      },
      {
        id: 'rx-quote-pay',
        question: 'When do I pay?',
        answer:
          'You do not pay at upload time. Admin adds the approved medicines, quantity, and price, then sends a quote to your account. You can review it and place the order from the prescription page.',
      },
      {
        id: 'rx-repeat',
        question: 'Do I need to upload prescription again for repeat orders?',
        answer:
          'For prescription-required medicines, a valid prescription is checked again before the order is completed. This keeps the process safe and compliant.',
      },
    ],
  },
  {
    id: 'bulk-buying',
    icon: Building2,
    title: 'Bulk buying',
    summary: 'Use this for business stock, clinic supplies, wholesale quantities, and B2B pricing.',
    questions: [
      {
        id: 'bulk-who',
        question: 'Who should use bulk purchase?',
        answer:
          'Bulk purchase is made for pharmacies, clinics, offices, distributors, and business buyers who need larger quantities or wholesale packs.',
      },
      {
        id: 'bulk-order',
        question: 'How do I place a bulk order?',
        answer:
          'Open Bulk Purchase, select a business product, choose the available bulk rate or quantity slab, apply a business coupon if available, and checkout.',
      },
      {
        id: 'bulk-coupons',
        question: 'Are bulk coupons different from normal coupons?',
        answer:
          'Yes. Business purchase coupons are separate from retail coupons, so B2B offers do not mix with normal customer offers or senior citizen discounts.',
      },
      {
        id: 'bulk-tracking',
        question: 'Where will I see business orders?',
        answer:
          'Business purchase orders show in My Orders with a separate badge, and admin can manage them separately from normal retail orders.',
      },
    ],
  },
  {
    id: 'order-tracking',
    icon: PackageCheck,
    title: 'Order tracking',
    summary: 'Track normal orders, prescription quote orders, and business purchases from one place.',
    questions: [
      {
        id: 'orders-where',
        question: 'Where can I see my orders?',
        answer:
          'All placed orders appear in My Orders after login. Normal product orders, prescription quote orders, and business purchases are shown with their own labels.',
      },
      {
        id: 'orders-detail',
        question: 'What details are available inside an order?',
        answer:
          'Open any order to view order status, delivery address, payment summary, item list, quantity, price, and order type.',
      },
      {
        id: 'orders-product',
        question: 'Can I open the ordered product again?',
        answer:
          'Yes. From the order detail page, clicking an item opens the related product page wherever that product link is available.',
      },
      {
        id: 'orders-status',
        question: 'How do status updates work?',
        answer:
          'Admin updates the order status from the admin panel. You can follow the latest status from My Orders and the order detail screen.',
      },
    ],
  },
  {
    id: 'delivery',
    icon: Truck,
    title: 'Delivery help',
    summary: 'Keep your saved address ready so checkout and prescription quotes can move faster.',
    questions: [
      {
        id: 'delivery-address',
        question: 'Which address is used for prescription quote orders?',
        answer:
          'The saved address selected during prescription upload is used when admin prepares your quote and when you place the final order.',
      },
      {
        id: 'delivery-change',
        question: 'Can I choose another saved address?',
        answer:
          'Yes. Before uploading a prescription or placing an order, select the saved address you want to use for that delivery.',
      },
      {
        id: 'delivery-call',
        question: 'Will someone call me?',
        answer:
          'If the prescription, quantity, medicine availability, or delivery information needs confirmation, the team calls you before sending the final quote.',
      },
      {
        id: 'delivery-history',
        question: 'Where can I check delivery and order history?',
        answer:
          'Use My Orders for order status and use the prescription page to view your uploaded prescription history and quote status.',
      },
    ],
  },
  {
    id: 'getting-started',
    icon: UserCircle,
    title: 'Getting started & account',
    summary: 'Everything about creating your account, managing your profile, and keeping it secure.',
    questions: [
      {
        id: 'account-create',
        question: 'How do I create an account?',
        answer:
          'Open the Register page and sign up with your full name, email address, mobile number, and a password. Registration takes less than a minute, and you can start browsing and adding items to your cart right away. You must be at least 18 years old to create an account and place orders.',
      },
      {
        id: 'account-login',
        question: 'How do I log in?',
        answer:
          'Sign in on the Login page with your registered email address and password. If you have trouble signing in, double-check for typos and make sure you are using the same email you registered with.',
      },
      {
        id: 'account-profile',
        question: 'How do I manage my profile and saved addresses?',
        answer:
          'Open your Profile page after logging in to update your personal details and manage saved delivery addresses. You can keep multiple addresses — such as home and office — and simply pick which one to use at checkout or during prescription upload.',
      },
      {
        id: 'account-history',
        question: 'Where can I see my order history?',
        answer:
          'All your orders appear in My Orders after login, including normal product orders, prescription quote orders, and business purchases. Open any order to see its full details, status, and items.',
      },
      {
        id: 'account-reset',
        question: 'I forgot my password. How do I reset it?',
        answer:
          'Use the Forgot Password page and enter your registered email address. We will send you password reset instructions — follow the link to the Reset Password page and set a new password. Reset links expire after a limited time, so complete the process promptly.',
      },
      {
        id: 'account-security',
        question: 'How is my account kept secure?',
        answer:
          'Your password is stored only in encrypted form, and we never ask for it by email or phone. Keep your password confidential, and never share login codes with anyone. If you suspect unauthorized use of your account, notify us immediately at support@capsandpills.com so we can secure it.',
      },
    ],
  },
  {
    id: 'product-genuineness',
    icon: ShieldCheck,
    title: 'Medicines & product genuineness',
    summary: 'How we make sure every product you receive is 100% genuine, safe, and properly stored.',
    questions: [
      {
        id: 'genuine-source',
        question: 'How do I know your medicines are genuine?',
        answer:
          'Every medicine and healthcare product we sell is sourced directly from licensed distributors and manufacturers — never from informal or grey-market channels. We operate in compliance with the regulations of the Philippine Food and Drug Administration (FDA).',
      },
      {
        id: 'genuine-tracking',
        question: 'What is batch and expiry tracking?',
        answer:
          'Every product in our catalog is tracked by batch number and expiry date, stored under proper conditions, and packed with care. This means we know exactly which batch your order came from — essential for recalls, quality checks, and your safety.',
      },
      {
        id: 'genuine-verify',
        question: 'How can I verify a product I received?',
        answer:
          'Check that the packaging is intact with unbroken seals, and look for the FDA Philippines registration number printed on the box or label. Confirm the batch number and expiry date are clearly printed and consistent. If anything looks tampered, faded, or suspicious, do not consume the product — contact us right away with photos.',
      },
      {
        id: 'genuine-generic',
        question: 'What is the difference between generic and branded medicines?',
        answer:
          'Generic medicines contain the same active ingredient, strength, and dosage form as their branded counterparts, and must meet the same FDA standards to be sold in the Philippines. They usually cost significantly less. Your doctor or pharmacist can advise whether a generic substitution is appropriate for your prescription.',
      },
      {
        id: 'genuine-storage',
        question: 'How should I store medicines in the Philippine climate?',
        answer:
          'Keep medicines in a cool, dry place away from direct sunlight and humidity — avoid bathrooms and hot cars, as heat and moisture degrade medicines quickly. Refrigerate only items whose label requires it, such as certain insulins and probiotics. Always keep medicines out of reach of children, and check expiry dates regularly.',
      },
      {
        id: 'genuine-report',
        question: 'What if a product arrives damaged or looks wrong?',
        answer:
          'Do not use the product. Take clear photos of the item, its packaging, and the delivery receipt, then report it to us within 48 hours of delivery at support@capsandpills.com with your order number. Damaged, wrong, or expired-on-arrival items are covered by our Refund & Returns Policy for a free replacement or refund.',
      },
    ],
  },
  {
    id: 'prescription-rules',
    icon: ClipboardCheck,
    title: 'Prescription medicine rules',
    summary: 'What requires a prescription, how verification works, and why these rules protect you.',
    questions: [
      {
        id: 'rx-which',
        question: 'Which products need a prescription?',
        answer:
          'Products marked as prescription-required (Rx) on their product page can only be dispensed against a valid prescription. This typically includes antibiotics and many medicines for chronic conditions. Over-the-counter products can be ordered freely without a prescription.',
      },
      {
        id: 'rx-verification',
        question: 'Why does a pharmacist verify my prescription?',
        answer:
          'Philippine law and FDA Philippines regulations require that Rx medicines be dispensed only against a valid prescription. Our licensed pharmacists review every prescription order before it is confirmed — checking that the right medicine, dose, and quantity match what your doctor prescribed. This is a safety check, not a formality.',
      },
      {
        id: 'rx-valid',
        question: 'What makes a prescription valid?',
        answer:
          'A valid prescription shows the doctor\'s full name, PRC license number, and signature, the date of issue, and your details as the patient, along with the medicine name, strength, dosage instructions, and quantity. It must be clear, legible, unaltered, and within its validity period. Upload a sharp photo or PDF so our pharmacists can review it without delay.',
      },
      {
        id: 'rx-rejected',
        question: 'What happens if my prescription is rejected?',
        answer:
          'If a prescription is invalid, expired, altered, illegible, or raises safety concerns, we reserve the right to refuse or cancel the order, and our team will reach out to explain why. Any payment you made for a cancelled order is refunded in full. You can re-upload a corrected or updated prescription whenever you have one.',
      },
      {
        id: 'rx-controlled',
        question: 'Do you sell controlled or restricted medicines?',
        answer:
          'Restricted items — including certain prescription, habit-forming, or age-restricted products — are handled strictly under Philippine pharmacy laws. They will not be sold to minors, and we may request proof of identity or age before completing such orders. Some products may not be available through online sale at all.',
      },
      {
        id: 'rx-repeat-orders',
        question: 'Can I reuse the same prescription for repeat orders?',
        answer:
          'Prescriptions may be re-validated for repeat orders to ensure continued safety and compliance. Depending on the medicine and how much time has passed, our pharmacist may ask for an updated prescription. This keeps your treatment aligned with your doctor\'s current advice.',
      },
    ],
  },
  {
    id: 'ordering-payments',
    icon: CreditCard,
    title: 'Ordering & payments',
    summary: 'From adding items to your cart to paying securely and confirming your order.',
    questions: [
      {
        id: 'order-steps',
        question: 'How do I place an order, step by step?',
        answer:
          'Browse the catalog and add items to your cart, then proceed to checkout. Select your saved delivery address, upload a prescription if your order contains Rx medicines, choose a payment method, and confirm. Your order is processed after payment confirmation and, for Rx orders, after pharmacist verification.',
      },
      {
        id: 'payment-methods',
        question: 'What payment methods do you accept?',
        answer:
          'We accept GCash, Maya, major cards, and other payment methods shown at checkout — the available options are always displayed before you pay. Cash on delivery may be offered for eligible orders. Choose whichever method is most convenient for you at checkout.',
      },
      {
        id: 'payment-security',
        question: 'Is my payment information safe?',
        answer:
          'Yes. Payments are processed securely by our accredited payment partners over encrypted connections. We do not store your full card or wallet credentials on our servers — only the transaction references needed to confirm and reconcile your payment.',
      },
      {
        id: 'order-confirmation',
        question: 'How do I know my order is confirmed?',
        answer:
          'Order confirmation is sent once payment and any required prescription verification are completed. You can then follow your order status anytime from My Orders in your account.',
      },
      {
        id: 'order-change',
        question: 'Can I modify or cancel my order?',
        answer:
          'You may cancel an order free of charge before it is dispatched — contact us as early as possible at support@capsandpills.com with your order number. Once an order has been shipped, especially prescription medicines already verified and packed, cancellation may no longer be possible and the return policy will apply instead. Address changes after dispatch may not be possible, so double-check your details at checkout.',
      },
      {
        id: 'order-price',
        question: 'What happens if an item is out of stock or priced incorrectly?',
        answer:
          'Placing an order constitutes an offer to purchase. We may decline or cancel orders due to stock issues, pricing errors, or verification concerns — in every such case, any payment made is refunded in full, and our team will inform you promptly.',
      },
    ],
  },
  {
    id: 'shipping-delivery',
    icon: Package,
    title: 'Shipping & delivery',
    summary: 'Fees, coverage, timelines, and how your medicines travel safely to your doorstep.',
    questions: [
      {
        id: 'ship-fees',
        question: 'How much is shipping and where do you deliver?',
        answer:
          'Shipping is free on all orders above ₱500, anywhere in the Philippines. Orders below ₱500 have a flat fee of ₱50 within Metro Manila and ₱90 for provincial addresses — any fee is shown clearly at checkout before you pay. We deliver nationwide across Metro Manila, Luzon, Visayas, and Mindanao through our trusted courier partners.',
      },
      {
        id: 'ship-time',
        question: 'How long does delivery take?',
        answer:
          'Estimated delivery from dispatch: Metro Manila 1–3 business days, Luzon (outside Metro Manila) 2–5 business days, and Visayas & Mindanao 3–7 business days. Orders containing prescription medicines are reviewed by our pharmacists before dispatch, which typically adds up to 1 business day. Business days exclude weekends and Philippine public holidays. See our Shipping Policy page for full details.',
      },
      {
        id: 'ship-cold',
        question: 'How are temperature-sensitive items handled?',
        answer:
          'Refrigerated and temperature-sensitive products — such as certain insulins, vaccines, and probiotics — are packed with insulated packaging and cold packs where needed. Please bring these items to proper storage as soon as they arrive, and inspect them upon delivery, as temperature-sensitive items cannot be returned once accepted.',
      },
      {
        id: 'ship-track',
        question: 'How do I track my parcel?',
        answer:
          'Once your order is dispatched, you can follow its status from the My Orders page in your account. Tracking updates are provided as the courier scans your package at each stage of the journey.',
      },
      {
        id: 'ship-weather',
        question: 'What happens during typhoons and bad weather?',
        answer:
          'During severe weather such as typhoons and flooding, courier operations may be suspended for safety, and deliveries to affected areas may be delayed. We prioritize the safety of riders and the integrity of your medicines, and we will keep you informed of significant delays.',
      },
      {
        id: 'ship-lost',
        question: 'What if my package is undelivered or lost?',
        answer:
          'Couriers typically attempt delivery up to two times, so please ensure someone is available to receive the package — especially for prescription and temperature-sensitive orders. If delivery fails repeatedly, the package is returned to us and we will contact you to arrange re-shipping or a refund. If your order is lost in transit, we will replace it or issue a full refund after confirmation with the courier.',
      },
    ],
  },
  {
    id: 'returns-refunds',
    icon: RotateCcw,
    title: 'Returns, refunds & replacements',
    summary: 'What you can return, how to request it, and when your refund arrives.',
    questions: [
      {
        id: 'return-window',
        question: 'How long do I have to request a return?',
        answer:
          'You may request a return or replacement within 7 days of receiving your order. For damaged, defective, wrong, or expired-on-arrival items, please report the issue as soon as possible — ideally within 48 hours of delivery — and keep the item and its packaging for inspection. See our Refund Policy page for full details.',
      },
      {
        id: 'return-eligible',
        question: 'Which items can I return?',
        answer:
          'We will gladly replace or refund items that are damaged or broken during transit, defective, incorrect (different product, brand, strength, or quantity than ordered), or expired or near-expiry upon arrival when a longer shelf life was reasonably expected.',
      },
      {
        id: 'return-non',
        question: 'Which items cannot be returned?',
        answer:
          'For safety and in line with standard pharmacy practice: medicines that have been opened, unsealed, or partially used; refrigerated or temperature-sensitive items once delivered and accepted; prescription medicines correctly dispensed against your prescription (returns are accepted only if we made an error or the item arrived damaged or expired); opened personal care and hygiene items; and items marked as final sale.',
      },
      {
        id: 'return-how',
        question: 'How do I request a return or refund?',
        answer:
          'Email us at support@capsandpills.com with your order number in the subject line. Briefly describe the issue and attach clear photos of the item, its packaging, and the delivery receipt if available. Our support team reviews requests within 1–2 business days and will confirm the next steps — replacement, refund, or return pickup where applicable.',
      },
      {
        id: 'return-timeline',
        question: 'When will I receive my refund?',
        answer:
          'Once approved, refunds are processed to your original payment method — GCash, Maya, card, or others — and are typically credited within 5–10 business days depending on your payment provider or bank. Shipping fees are refunded when the return is due to our error. For cash-on-delivery orders, refunds are issued via GCash, Maya, or bank transfer.',
      },
      {
        id: 'return-replacement',
        question: 'Can I get a replacement instead of a refund?',
        answer:
          'Yes. For damaged, defective, wrong, or expired items, we offer a free replacement shipped to you at no extra cost, subject to stock availability. If the item is no longer available, a full refund will be issued instead.',
      },
    ],
  },
  {
    id: 'doctor-consultations',
    icon: Stethoscope,
    title: 'Doctor consultations',
    summary: 'How online consultations work, who the doctors are, and how e-prescriptions fit in.',
    questions: [
      {
        id: 'consult-how',
        question: 'How does an online consultation work?',
        answer:
          'Choose a doctor from our directory, book a time slot that fits your schedule, then meet the doctor through a secure video or chat consultation. When medically appropriate, your doctor issues an e-prescription you can use to order medicines on Capsandpills. See our Doctor Consultation page for the full walkthrough.',
      },
      {
        id: 'consult-doctors',
        question: 'Who are the doctors on the platform?',
        answer:
          'All doctors on Capsandpills are PRC-licensed Filipino physicians whose credentials are verified before they join the platform. You can browse doctors by specialty, location, and teleconsultation availability to find the right fit for your concern.',
      },
      {
        id: 'consult-fees',
        question: 'How much does a consultation cost?',
        answer:
          'Consultation fees are set per doctor and are shown clearly on their profile before you book — you always see the price before you commit. Fees vary by doctor and specialty, and are paid through the same secure checkout as your medicine orders.',
      },
      {
        id: 'consult-eprescription',
        question: 'How do I use my e-prescription?',
        answer:
          'Your e-prescription is linked to your account after the consultation, and you can order the prescribed medicines directly on Capsandpills for delivery to your door. As with any prescription order, our licensed pharmacists verify it before dispensing, in line with FDA Philippines regulations.',
      },
      {
        id: 'consult-privacy',
        question: 'Is my health information kept private?',
        answer:
          'Yes. Your consultations are confidential, and health information you share is accessible only to your doctor and authorized pharmacy staff. It is protected under the Data Privacy Act of 2012 — we never sell your health data and never use it for advertising.',
      },
      {
        id: 'consult-limits',
        question: 'What can an online consultation not do?',
        answer:
          'Online consultations complement but do not replace in-person medical care where a physical examination is needed — your doctor will advise if you should be seen face to face. For emergencies such as difficulty breathing, chest pain, or severe allergic reactions, call 911 or go to the nearest emergency room immediately.',
      },
    ],
  },
  {
    id: 'offers-discounts',
    icon: Tag,
    title: 'Offers, coupons & discounts',
    summary: 'How to save with coupons, flash deals, and statutory senior citizen & PWD discounts.',
    questions: [
      {
        id: 'coupon-apply',
        question: 'How do I apply a coupon code?',
        answer:
          'Enter your coupon code in the coupon field at checkout before paying, then confirm it is applied — the discount is shown in your order summary before you complete payment. If the code is valid for your cart, the price updates immediately.',
      },
      {
        id: 'coupon-b2b',
        question: 'Can I use retail coupons on bulk or B2B orders?',
        answer:
          'No. Business purchase coupons are separate from retail coupons, so B2B offers do not mix with normal customer offers or senior citizen discounts. Each coupon is valid only for the order type it was issued for.',
      },
      {
        id: 'discount-senior',
        question: 'Do you honor senior citizen and PWD discounts?',
        answer:
          'Yes. Eligible senior citizens and persons with disabilities are entitled to statutory discounts on medicines under Philippine law (RA 9994 and RA 10754, respectively). Provide your valid senior citizen or PWD ID details as instructed during checkout or to our support team so we can verify and apply the correct discount to eligible items.',
      },
      {
        id: 'offers-flash',
        question: 'Where can I find current deals and promotions?',
        answer:
          'Visit our Offers page for current promotions, flash deals, and seasonal discounts. Flash deals run for a limited time or while stocks last, so check back regularly — new offers are added frequently.',
      },
      {
        id: 'coupon-invalid',
        question: 'Why is my coupon not working?',
        answer:
          'Common reasons: the code has expired, your cart does not meet the minimum order value, the coupon is restricted to certain products or categories, it was issued for a different order type (retail vs B2B), or it has already been used on a previous order. Check the coupon\'s terms, and if it still should apply, contact support@capsandpills.com.',
      },
      {
        id: 'discount-stack',
        question: 'Can I combine multiple discounts on one order?',
        answer:
          'Generally, only one coupon code can be applied per order, and coupons do not combine with statutory senior citizen or PWD discounts on the same items. Where both could apply, the system applies the better eligible discount for you — you never need to do the math yourself.',
      },
    ],
  },
];

const FAQ = () => {
  const { hash } = useLocation();
  const [openIds, setOpenIds] = useState({});
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const supportEmail = 'support@capsandpills.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      window.prompt('Copy our support email:', supportEmail);
    }
  };

  const toggleQuestion = (id) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(hash.slice(1));
    if (target) {
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [hash]);

  return (
    <div className="container-custom py-6 sm:py-10">
      <Link to="/" className="pressable mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div id="top" className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Capsandpills Support</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">Help Center</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
          Clear answers on every part of Capsandpills — accounts, genuine medicines, prescriptions, ordering, payments, shipping, returns, doctor consultations, and discounts. Choose a topic below to jump directly to the section you need.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {sections.map(({ id, title }) => (
            <Link
              key={id}
              to={`/faq#${id}`}
              className="pressable rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
            >
              {title}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {sections.map(({ id, icon: Icon, title, summary, questions }) => (
          <section key={id} id={id} className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-950">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">{summary}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {questions.map(({ id: questionId, question, answer }) => {
                const isOpen = Boolean(openIds[questionId]);
                return (
                  <article
                    key={questionId}
                    id={questionId}
                    className="scroll-mt-24 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuestion(questionId)}
                      className="flex w-full items-center justify-between gap-3 text-left font-bold text-gray-950 focus:outline-none"
                    >
                      <span className="text-sm">{question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-brand' : ''
                        }`}
                      />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? 'auto' : 0,
                        opacity: isOpen ? 1 : 0,
                        marginTop: isOpen ? 8 : 0,
                      }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm leading-6 text-gray-600">{answer}</p>
                    </motion.div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Still need help */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Still need help?</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                Can't find the answer you're looking for? Our support team is happy to help — in English or Filipino.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowEmailPopup(true)}
              className="pressable inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              <Mail className="h-4 w-4" />
              Email us
            </button>
            <a
              href="tel:+63281234567"
              className="pressable inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
            >
              <Phone className="h-4 w-4" />
              +63 2 8123 4567
            </a>
            <Link
              to="/contact"
              className="pressable inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
            >
              <MessageCircle className="h-4 w-4" />
              Contact page
            </Link>
          </div>
        </div>
      </div>

      {/* Email popup */}
      {showEmailPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowEmailPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Mail className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-gray-950">Email our support team</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPopup(false)}
                className="pressable rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-sm leading-6 text-gray-500">
              Mail us at this address and we will reply within 1 business day:
            </p>

            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <span className="truncate text-sm font-semibold text-gray-800">{supportEmail}</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="pressable inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-brand/30 hover:text-brand"
              >
                {emailCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {emailCopied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <a
              href={`mailto:${supportEmail}`}
              className="pressable flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              <Mail className="h-4 w-4" />
              Open mail app
            </a>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FAQ;
