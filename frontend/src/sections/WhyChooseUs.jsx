import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

import firstaidkit from '../assets/lottie/firstaidkit.json';
import locked from '../assets/lottie/locked.json';
import mentaltherapy from '../assets/lottie/mentaltherapy.json';
import onlinedeliveryservice from '../assets/lottie/onlinedeliveryservice.json';

const features = [
  {
    animation: firstaidkit,
    title: '100% Genuine Medicines',
    description:
      'All products sourced directly from licensed manufacturers and distributors.',
  },
  {
    animation: onlinedeliveryservice,
    title: 'Express Delivery',
    description:
      'Get your medicines delivered within 2-4 hours in select cities.',
  },
  {
    animation: locked,
    title: 'Safe & Secure Payments',
    description:
      'Encrypted transactions with multiple payment options including COD.',
  },
  {
    animation: mentaltherapy,
    title: 'Free Doctor Consultation',
    description:
      'Connect with certified doctors 24/7 for medical advice and prescriptions.',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="pt-10 pb-12 lg:pt-12 lg:pb-16 bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3">
  <span className="text-gray-900">Why Choose </span>
  <span className="text-[#0B3B92]">Caps & </span>
  <span className="text-[#FF4D8D]">Pills</span>
  <span className="text-gray-900">?</span>
</h2>

          <p className="text-gray-600 max-w-xl mx-auto">
            Quality medicines. Better care. Every day.
          </p>
        </div>

        {/* Features */}
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex h-full min-h-[280px] flex-col rounded-2xl bg-white p-5 text-center transition-all duration-300 hover:shadow-lg sm:min-h-[350px] sm:p-6"
            >
              {/* Lottie Animation */}
              <div className="mb-4 flex h-28 items-center justify-center sm:mb-5 sm:h-36">
                <Lottie
                  animationData={feature.animation}
                  loop
                  autoplay
                  className="h-24 w-24 sm:h-32 sm:w-32"
                />
              </div>

              {/* Title */}
              <h3 className="mb-2 flex min-h-[52px] items-center justify-center text-lg font-semibold leading-snug text-gray-900">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mx-auto max-w-[220px] text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
