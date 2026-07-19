import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Newspaper } from 'lucide-react';

const articles = [
  {
    title: 'How to Spot Fake Medicines in the Philippines',
    excerpt:
      'Counterfeit medicines remain a real problem. Learn the telltale signs — from suspicious packaging and missing FDA registration numbers to prices that are too good to be true.',
    category: 'Medicine Safety',
    readTime: '6 min read',
  },
  {
    title: 'Storing Your Medicines in Tropical Heat',
    excerpt:
      'Philippine heat and humidity can ruin medicines faster than you think. Here\'s how to store tablets, syrups, and insulin properly — and which items should never sit in a hot car.',
    category: 'Wellness Tips',
    readTime: '4 min read',
  },
  {
    title: 'A Practical Guide to Vitamins and Supplements',
    excerpt:
      'Vitamin C, B-complex, zinc, collagen — what actually works, what\'s just marketing, and how to choose supplements that are worth your peso.',
    category: 'Nutrition',
    readTime: '7 min read',
  },
  {
    title: 'Generic vs. Branded Medicines: What\'s the Real Difference?',
    excerpt:
      'Generics can cost a fraction of branded medicines — but are they just as effective? We break down bioequivalence, FDA standards, and when it makes sense to switch.',
    category: 'Medicine Education',
    readTime: '5 min read',
  },
  {
    title: 'Understanding Your Prescription: A Beginner\'s Guide',
    excerpt:
      'Sig codes, dosage frequency, and those hard-to-read doctor\'s notes — decode your prescription so you always take the right medicine at the right time.',
    category: 'Medicine Education',
    readTime: '5 min read',
  },
  {
    title: 'Staying Healthy During the Rainy Season',
    excerpt:
      'Dengue, leptospirosis, and the flu all spike when the rains come. Practical prevention tips every Filipino household should know before the storms arrive.',
    category: 'Seasonal Health',
    readTime: '4 min read',
  },
];

const Blog = () => {
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
        <div className="mb-12 sm:mb-16">
          <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center mb-3">
            <Newspaper className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">The Capsandpills Blog</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Practical, pharmacist-reviewed articles on medicines, wellness, and everyday health —
            written for Filipino families. No jargon, no scare tactics, just useful information you
            can act on.
          </p>
        </div>

        {/* Articles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {articles.map((article) => (
            <article
              key={article.title}
              className="border border-gray-200 rounded-xl p-5 hover:border-brand/40 transition-colors"
            >
              <span className="inline-block text-[11px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full mb-3">
                {article.category}
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5">
                {article.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                {article.excerpt}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
            </article>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 sm:mt-16 bg-brand/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Health information you can trust
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Every article we publish is reviewed by our licensed pharmacists before it goes live.
            Still, blog content is general information — not personal medical advice. Always consult
            your doctor about your specific condition.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blog;
