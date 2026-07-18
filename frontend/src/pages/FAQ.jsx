import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, ChevronDown, FileText, PackageCheck, Truck } from 'lucide-react';

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
];

const FAQ = () => {
  const { hash } = useLocation();
  const [openIds, setOpenIds] = useState({});

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
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div id="top" className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Help Center</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">Frequently Asked Questions</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
          Clear answers for prescription quote orders, bulk purchase, order tracking, and delivery. Choose a topic below to jump directly to the required section.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {sections.map(({ id, title }) => (
            <Link
              key={id}
              to={`/faq#${id}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
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
    </div>
  );
};

export default FAQ;
