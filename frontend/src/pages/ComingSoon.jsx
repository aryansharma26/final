import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

const ComingSoon = () => {
  return (
    <div className="container-custom py-20 text-center">
      <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Construction className="w-8 h-8 text-brand" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h1>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        This page is under construction. We're working hard to bring you something great.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default ComingSoon;
