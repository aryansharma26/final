import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const illustrationCredits = [
  {
    title: 'Joyful female doctor',
    titleUrl: 'https://iconscout.com/illustrations/joyful-female-doctor',
    author: 'Genko Mono',
    authorUrl: 'https://iconscout.com/contributors/genkomono',
  },
  {
    title: 'Medicine',
    titleUrl: 'https://iconscout.com/illustrations/medicine',
    author: 'Altri Kharisma Rozaq',
    authorUrl: 'https://iconscout.com/contributors/alkharostudio',
  },
  {
    title: 'Doctor checking patient with stethoscope',
    titleUrl: 'https://iconscout.com/illustrations/doctor',
    author: 'Urlight',
    authorUrl: 'https://iconscout.com/contributors/zridxs',
  },
];

const animationCredits = [
  {
    title: 'First Aid Kit',
    titleUrl: 'https://iconscout.com/lottie-animations/first-aid-kit',
    author: 'Victoria Shelest',
    authorUrl: 'https://iconscout.com/contributors/victoria-motion',
  },
  {
    title: 'Online Delivery Service',
    titleUrl: 'https://iconscout.com/lottie-animations/online-delivery-service',
    author: 'Urlight',
    authorUrl: 'https://iconscout.com/contributors/zridxs',
  },
  {
    title: 'Locked',
    titleUrl: 'https://iconscout.com/lottie-animations/locked',
    author: 'Google Inc.',
    authorUrl: 'https://iconscout.com/contributors/google-inc',
  },
  {
    title: 'Mental Therapy',
    titleUrl: 'https://iconscout.com/lottie-animations/mental-therapy',
    author: 'BoltBite',
    authorUrl: 'https://iconscout.com/contributors/boltbite',
  },
  {
    title: 'Preventive Health Care',
    titleUrl: 'https://iconscout.com/lottie-animations/preventive-health-care',
    author: 'nanoagency',
    authorUrl: 'https://iconscout.com/contributors/nanoagency',
  },
];

const CreditItem = ({ title, titleUrl, author, authorUrl }) => (
  <li className="text-sm text-gray-600">
    <a
      href={titleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable text-brand hover:text-brand-dark transition-colors"
    >
      {title}
    </a>
    {' '}by{' '}
    <a
      href={authorUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable text-brand hover:text-brand-dark transition-colors"
    >
      {author}
    </a>
  </li>
);

const Credits = () => {
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Credits</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-8">
          We use illustrations and animations created by talented artists from{' '}
          <a
            href="https://iconscout.com"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable text-brand hover:text-brand-dark transition-colors"
          >
            IconScout
          </a>
          . Huge thanks to the creators below.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Illustrations</h2>
        <ul className="space-y-2 mb-8">
          {illustrationCredits.map((credit) => (
            <CreditItem key={credit.title} {...credit} />
          ))}
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Animations</h2>
        <ul className="space-y-2">
          {animationCredits.map((credit) => (
            <CreditItem key={credit.title} {...credit} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Credits;
