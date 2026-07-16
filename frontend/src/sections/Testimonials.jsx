import { motion } from 'framer-motion';
import { Quote, ShieldCheck, Star } from 'lucide-react';

import familyBackground from '../assets/testimonials/family-testimonial.png';

const REVIEWS = [
  {
    id: 1,
    name: 'Maria Santos',
    location: 'Manila, Philippines',
    title: 'Monthly medicines made simple',
    rating: 5,
    text:
      'Capsandpills made our regular medicine orders simple. Prescriptions are checked quickly, prices are fair, and every delivery arrives sealed and on time.',
  },
  {
    id: 2,
    name: 'Jose Reyes',
    location: 'Cebu City, Philippines',
    title: 'Reliable for the whole family',
    rating: 5,
    text:
      'We order for our parents and kids from one place now. The updates are clear, support is kind, and we always feel confident about what is being delivered.',
  },
  {
    id: 3,
    name: 'Alyssa Cruz',
    location: 'Davao City, Philippines',
    title: 'Fast, careful, and easy',
    rating: 5,
    text:
      'The experience feels personal, not confusing. We upload the prescription, track the order, and receive everything neatly packed at home.',
  },
];

const renderStars = (rating) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        strokeWidth={1.8}
        className={`h-4 w-4 ${
          index < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

const Testimonials = () => {
  return (
    <section className="relative overflow-hidden bg-white py-12 lg:py-16">
      <div className="absolute inset-x-0 top-6 h-[560px] overflow-hidden">
        <img
          src={familyBackground}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-105 object-cover opacity-45 saturate-110"
          style={{ objectPosition: 'center 38%' }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-white/38" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-transparent to-white/70" />
      </div>

      <div className="container-custom relative">
        <div className="mx-auto max-w-6xl py-6 lg:py-8">
          <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-brand-light/70 blur-3xl" />
          <div className="absolute -right-14 bottom-0 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45 }}
              className="mx-auto mb-9 max-w-2xl text-center"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-xs font-semibold text-brand shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                Verified family reviews
              </div>

              <h2 className="mb-3 text-2xl font-bold leading-tight text-gray-900 lg:text-4xl">
                Happy Philippines families trust Capsandpills
              </h2>

              <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
                A soft family moment in the background, and real customer experiences in
                focus. Genuine medicines, careful prescription checks, and dependable
                doorstep delivery.
              </p>
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-3">
              {REVIEWS.map((review, index) => (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex h-full flex-col rounded-2xl bg-white/78 p-5 shadow-[0_18px_45px_rgba(17,24,39,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_22px_55px_rgba(17,24,39,0.12)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{review.title}</h3>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        {review.name} - {review.location}
                      </p>
                    </div>
                    <Quote className="h-8 w-8 shrink-0 text-brand/25" />
                  </div>

                  <div className="mb-4">{renderStars(review.rating)}</div>

                  <p className="flex-1 text-sm leading-relaxed text-gray-700">
                    "{review.text}"
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
