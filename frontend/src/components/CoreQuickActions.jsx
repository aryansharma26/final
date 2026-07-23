import { Link, useLocation } from 'react-router-dom';
import { Building2, FileText, Pill, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionLink = motion(Link);

const actions = [
  {
    to: '/prescriptions',
    label: 'Rx Quote',
    icon: FileText,
    className: 'text-white bg-brand border-brand',
  },
  {
    to: '/medicines',
    label: 'Medicines',
    icon: Pill,
    className: 'text-gray-700 bg-white border-gray-200',
  },
  {
    to: '/doctors',
    label: 'Find Doctor',
    icon: Stethoscope,
    className: 'text-gray-700 bg-white border-gray-200',
  },
  {
    to: '/b2b-enquiry',
    label: 'Bulk Buy',
    icon: Building2,
    className: 'text-gray-700 bg-white border-gray-200',
  },
];

const CoreQuickActions = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <motion.div
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.1 }}
      className="fixed bottom-3 left-3 right-3 z-40 lg:hidden transform-gpu"
    >
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-gray-100/80 bg-white/95 p-2 shadow-[0_12px_28px_rgba(15,23,42,0.16)] backdrop-blur-md">
        {actions.map(({ to, label, icon: Icon, className }) => {
          const active = location.pathname.startsWith(to);
          return (
            <MotionLink
              key={to}
              to={to}
              whileTap={{ scale: 0.92, y: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className={`pressable relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-[10px] font-semibold transition-colors min-[390px]:text-[11px] transform-gpu ${
                active
                  ? 'text-white bg-brand border-brand shadow-sm'
                  : className
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform duration-200" />
              <span className="max-w-full truncate leading-none">{label}</span>
            </MotionLink>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CoreQuickActions;
