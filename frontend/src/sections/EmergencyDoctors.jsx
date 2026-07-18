import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Siren, Star, Phone, ChevronRight, MapPin } from 'lucide-react';
import { doctorAPI } from '../api/index.js';

const EmergencyDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const { data } = await doctorAPI.getEmergencyDoctors();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Failed to load emergency doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && doctors.length === 0) return null;

  return (
    <section className="py-7 sm:py-10 bg-red-50/50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Emergency Doctors</h2>
              <p className="text-sm text-gray-500">Available for urgent medical care</p>
            </div>
          </div>
          <Link to="/doctors?emergency=true" className="hidden sm:flex items-center gap-1 text-red-600 font-medium text-sm hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-2 sm:p-4 border border-red-100 animate-pulse">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-full mx-auto mb-2 sm:mb-3" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
                <div className="hidden sm:block h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {doctors.slice(0, 4).map((doctor) => (
              <div
                key={doctor._id}
                className="bg-white rounded-2xl p-2 sm:p-4 border border-red-100 hover:shadow-md transition-shadow"
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
                    <div className="flex min-w-0 items-center justify-center gap-1.5 sm:justify-start">
                      <h3 className="truncate text-[10px] font-semibold text-gray-900 sm:text-sm">{doctor.name}</h3>
                      <span className="hidden px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full sm:inline">EMERGENCY</span>
                    </div>
                    <p className="hidden truncate text-xs text-brand sm:block">{doctor.specialty?.name}</p>
                    <div className="mt-0.5 flex items-center justify-center gap-0.5 sm:justify-start sm:gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-medium text-gray-700 sm:text-xs">{doctor.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 hidden pt-3 border-t border-gray-100 space-y-1.5 sm:block">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {doctor.city?.name}, {doctor.province?.name}
                  </p>
                  <p className="text-xs text-gray-500">{doctor.hospitalClinic}</p>
                </div>
                <div className="mt-3 hidden gap-2 sm:flex">
                  <a
                    href={`tel:${doctor.phone}`}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Now
                  </a>
                  <Link
                    to={`/doctors/${doctor.slug}`}
                    className="px-3 py-2 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sm:hidden mt-4 text-center">
          <Link to="/doctors?emergency=true" className="inline-flex items-center gap-1 text-red-600 font-medium text-sm hover:underline">
            View All Emergency Doctors <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EmergencyDoctors;
