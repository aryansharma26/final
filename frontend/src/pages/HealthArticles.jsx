import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Droplets, Moon, Activity, Salad, Brain, Sun } from 'lucide-react';

const guides = [
  {
    icon: Sun,
    title: 'Daily Wellness Habits That Actually Stick',
    category: 'Habits',
    summary:
      'Big health changes rarely last. This guide shows how to build a realistic daily routine — hydration, movement, and sleep anchors — that survives even the busiest work week.',
  },
  {
    icon: Droplets,
    title: 'Hydration in a Tropical Climate',
    category: 'Hydration',
    summary:
      'How much water do you really need in Philippine heat? Learn the early signs of dehydration, when plain water isn\'t enough, and how oral rehydration salts fit in.',
  },
  {
    icon: Moon,
    title: 'Sleep: The Most Underrated Medicine',
    category: 'Sleep',
    summary:
      'Poor sleep weakens immunity, focus, and mood. Practical sleep hygiene tips — from caffeine cutoffs to screen habits — tailored for shift workers and night owls.',
  },
  {
    icon: Activity,
    title: 'Moving More at a Desk Job',
    category: 'Fitness',
    summary:
      'You don\'t need a gym membership to protect your back, neck, and heart. Simple desk stretches, walking routines, and micro-workouts you can do anywhere.',
  },
  {
    icon: Salad,
    title: 'Eating Well on a Filipino Budget',
    category: 'Nutrition',
    summary:
      'Healthy eating doesn\'t have to mean expensive imported food. How to build balanced meals around malunggay, kangkong, bangus, eggs, and other affordable local staples.',
  },
  {
    icon: Brain,
    title: 'Managing Stress the Healthy Way',
    category: 'Mental Wellness',
    summary:
      'Chronic stress shows up as headaches, poor sleep, and frequent colds. Breathing exercises, boundaries, and when to seek professional support.',
  },
];

const HealthArticles = () => {
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
            <BookOpen className="w-5 h-5 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Health & Wellness Guides</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            A curated library of practical wellness guides — covering the everyday habits that keep
            you healthy long before you ever need a medicine. Each guide is written in plain language
            and reviewed by our pharmacists.
          </p>
        </div>

        {/* Guides list */}
        <div className="space-y-4 mb-12 sm:mb-16">
          {guides.map((guide, index) => (
            <article key={guide.title} className="border border-gray-200 rounded-xl p-5 flex items-start gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                  <guide.icon className="w-5 h-5 text-brand" />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-gray-500">Guide {index + 1}</span>
                  <span className="text-[11px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                    {guide.category}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5">{guide.title}</h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{guide.summary}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Note */}
        <div className="bg-brand/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Prevention first, always
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            These guides support a healthy lifestyle but are not a substitute for professional
            medical advice, diagnosis, or treatment. If you have a health concern, consult a
            physician — or book an online consultation with one of our partner doctors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthArticles;
