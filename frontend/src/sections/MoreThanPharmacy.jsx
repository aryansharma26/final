import { motion } from 'framer-motion';
import medicine from "../assets/medicine.svg";
import joyfulfemaledoctor from "../assets/joyfulfemaledoctor.svg";
import doctorcheckingpatientwithstethoscope from "../assets/doctorcheckingpatientwithstethoscope.svg";

/* ═════════════════════════════════════════════════════════════
   Card 1: Doctor + Patient (Online Consultation)
   ── TUMHARA SVG YAHAAN DAALO ──
   ═════════════════════════════════════════════════════════════ */
const DoctorPatientSVG = () => (
  <img src={medicine} alt="" className="h-full max-h-52 w-full translate-y-3 object-contain" />
);


/* ═════════════════════════════════════════════════════════════
   Card 2: Health Checkup
   ── TUMHARA SVG YAHAAN DAALO ──
   ═════════════════════════════════════════════════════════════ */
const CheckupSVG = () => (
  <img src={joyfulfemaledoctor} alt="" className="h-full max-h-52 w-full object-contain" />
);

/* ═════════════════════════════════════════════════════════════
   Card 3: Reading Health Tips
   ── TUMHARA SVG YAHAAN DAALO ──
   ═════════════════════════════════════════════════════════════ */
const ReadingSVG = () => (
  <img src={doctorcheckingpatientwithstethoscope} alt="" className="h-full max-h-52 w-full object-contain" />
);

const services = [
  {
    title: 'Genuine Medicines',
    description: 'Quality-assured medicines from trusted manufacturers for your healthcare needs.',
    Illustration: DoctorPatientSVG,
    bg: '#FFF5F7',
  },
  {
    title: 'Compassionate Care',
    description: 'Dedicated to supporting your health with care and compassion.',
    Illustration: CheckupSVG,
    bg: '#F0FDF4',
  },
  {
    title: 'Health Tips & Articles',
    description: 'Expert-written articles on wellness, nutrition, diseases, and healthy living.',
    Illustration: ReadingSVG,
    bg: '#FFFBEB',
  },
];

const MoreThanPharmacy = () => {
  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            More Than Just a Pharmacy
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Complete healthcare services at your fingertips
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {services.map((service, index) => {
            const Illustration = service.Illustration;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                {/* SVG Area — Bada, Borderless */}
                <div className="relative flex h-40 items-center justify-center overflow-hidden sm:h-48 lg:h-56">
                  <Illustration />
                </div>

                {/* Content */}
                <div className="pt-5 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MoreThanPharmacy;
