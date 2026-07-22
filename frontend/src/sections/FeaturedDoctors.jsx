import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Star, ChevronRight, User } from 'lucide-react';
import { doctorAPI } from '../api/index.js';

const DOCTORS_CACHE_KEY = 'featured-doctors-cache';

const getCachedDoctors = () => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = JSON.parse(sessionStorage.getItem(DOCTORS_CACHE_KEY) || '[]');
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
};

const setCachedDoctors = (docs) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DOCTORS_CACHE_KEY, JSON.stringify(docs));
  } catch {}
};

const FeaturedDoctors = () => {
  const [doctors, setDoctors] = useState(getCachedDoctors);
  const [loading, setLoading] = useState(getCachedDoctors().length === 0);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      if (doctors.length === 0) setLoading(true);
      const { data } = await doctorAPI.getFeaturedDoctors();
      const docs = data.doctors || [];
      setDoctors(docs);
      setCachedDoctors(docs);
    } catch (err) {
      console.error('Failed to load featured doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && doctors.length === 0) return null;

  return (
    <section className="py-7 sm:py-10 bg-gray-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-brand" />
              Featured Doctors
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Top-rated healthcare professionals</p>
          </div>
          <Link to="/doctors" className="pressable hidden sm:flex items-center gap-1 text-brand font-medium text-sm hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-2 sm:p-4 border border-gray-100 animate-pulse">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-full mx-auto mb-2 sm:mb-3" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
                <div className="hidden sm:block h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {doctors.map((doctor) => (
              <Link
                key={doctor._id}
                to={`/doctors/${doctor.slug}`}
                className="pressable bg-white rounded-2xl p-2 sm:p-4 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 max-w-full">
                    <h3 className="truncate text-[10px] font-semibold text-gray-900 transition-colors group-hover:text-brand sm:text-sm">{doctor.name}</h3>
                    <p className="hidden truncate text-xs text-brand sm:block">{doctor.specialty?.name}</p>
                    <div className="mt-0.5 flex items-center justify-center gap-0.5 sm:justify-start sm:gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-medium text-gray-700 sm:text-xs">{doctor.rating?.toFixed(1) || '0.0'}</span>
                      <span className="hidden text-xs text-gray-400 sm:inline">({doctor.numReviews || 0})</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 hidden pt-3 border-t border-gray-100 items-center justify-between text-xs text-gray-500 sm:flex">
                  <span>{doctor.city?.name}</span>
                  <span className="font-medium text-gray-900">₱{doctor.consultationFee}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="sm:hidden mt-4 text-center">
          <Link to="/doctors" className="pressable inline-flex items-center gap-1 text-brand font-medium text-sm hover:underline">
            View All Doctors <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDoctors;
