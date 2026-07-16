import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Star, Clock, Shield, Video, Siren, Stethoscope, Calendar, ExternalLink, Navigation, User, X } from 'lucide-react';
import { doctorAPI } from '../api/index.js';

const DoctorDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [relatedDoctors, setRelatedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowContactModal(false);
    };
    if (showContactModal) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [showContactModal]);

  useEffect(() => {
    loadDoctor();
  }, [slug]);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await doctorAPI.getDoctorBySlug(slug);
      setDoctor(data.doctor);
      setRelatedDoctors(data.relatedDoctors || []);
    } catch (err) {
      console.error('Failed to load doctor:', err);
      setError('Doctor not found or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 'w-4 h-4') => (
    <div className="flex items-center gap-0.5">
      <Star className={`${size} text-yellow-400 fill-yellow-400`} />
      <span className="text-sm font-medium text-gray-700">{rating?.toFixed(1) || '0.0'}</span>
      <span className="text-xs text-gray-400">({doctor?.numReviews || 0} reviews)</span>
    </div>
  );

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="animate-pulse grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
          <div className="col-span-12 lg:col-span-8 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!doctor || error) {
    return (
      <div className="container-custom py-16 text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">{error || 'Doctor not found'}</p>
        <button onClick={() => navigate(-1)} className="text-brand font-medium hover:underline mt-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container-custom py-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 mx-auto">
                <img
                  src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face'}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {doctor.isVerified && (
                <div className="absolute bottom-1 right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold text-gray-900">{doctor.name}</h1>
            <p className="text-sm text-brand font-medium mt-1">{doctor.specialty?.name}</p>
            <div className="flex items-center justify-center mt-2">
              {renderStars(doctor.rating, 'w-5 h-5')}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {doctor.isEmergency && (
                <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full flex items-center gap-1">
                  <Siren className="w-3 h-3" /> Emergency
                </span>
              )}
              {doctor.teleconsultation && (
                <span className="px-2.5 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full flex items-center gap-1">
                  <Video className="w-3 h-3" /> Teleconsultation
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-left space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{doctor.yearsOfExperience} years of experience</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Stethoscope className="w-4 h-4 text-gray-400" />
                <span>{doctor.hospitalClinic}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{doctor.city?.name}, {doctor.province?.name}</span>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowContactModal(true)}
                className="py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call Now
              </button>
              {doctor.email && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
              )}
              {doctor.googleMapsUrl && (
                <a
                  href={doctor.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Navigation className="w-4 h-4" /> Get Directions
                </a>
              )}
            </div>
          </div>

          {/* Consultation Fee */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Consultation Fee</h3>
            <p className="text-2xl font-bold text-brand">₱{doctor.consultationFee}</p>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {(doctor.about || doctor.education) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About Doctor</h2>
              {doctor.about && <p className="text-sm text-gray-600 leading-relaxed">{doctor.about}</p>}
              {doctor.education && (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Education & Training</h3>
                  <p className="text-sm text-gray-600">{doctor.education}</p>
                </div>
              )}
            </div>
          )}

          {/* Availability */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              Availability Schedule
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {doctor.availableDays?.length > 0 ? (
                doctor.availableDays.map((day) => (
                  <div key={day} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-brand" />
                    <span className="font-medium">{day}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 col-span-2">Availability schedule not provided</p>
              )}
            </div>
            {doctor.availableHours && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-brand" />
                <span>Hours: {doctor.availableHours}</span>
              </div>
            )}
          </div>

          {/* Address & Maps */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand" />
              Location & Address
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{doctor.hospitalClinic}</p>
              <p>{doctor.address}</p>
              <p>{doctor.city?.name}, {doctor.province?.name}, {doctor.region?.name}</p>
              <p>Philippines</p>
            </div>
            {doctor.googleMapsUrl && (
              <a
                href={doctor.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand font-medium hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> View on Google Maps
              </a>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3 text-sm">
              {doctor.phone && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center gap-3 text-gray-600 hover:text-brand transition-colors text-left"
                >
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{doctor.phone}</span>
                </button>
              )}
              {doctor.email && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center gap-3 text-gray-600 hover:text-brand transition-colors text-left"
                >
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{doctor.email}</span>
                </button>
              )}
            </div>
          </div>

          {/* Related Doctors */}
          {relatedDoctors.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Related Doctors</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {relatedDoctors.map((d) => (
                  <Link
                    key={d._id}
                    to={`/doctors/${d.slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={d.profilePhoto || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face'}
                        alt={d.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.specialty?.name}</p>
                      <p className="text-xs text-gray-400">{d.city?.name}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium">{d.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && doctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowContactModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Contact {doctor.name}</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Phone */}
              {doctor.phone && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Phone className="w-4 h-4 text-brand" />
                    <span className="flex-1 text-sm font-medium text-gray-900">{doctor.phone}</span>
                  </div>
                  <a
                    href={`tel:${doctor.phone}`}
                    className="mt-2 w-full py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                </div>
              )}

              {/* Email */}
              {doctor.email && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Mail className="w-4 h-4 text-brand" />
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{doctor.email}</span>
                  </div>
                  <a
                    href={`mailto:${doctor.email}`}
                    className="mt-2 w-full py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Send Email
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetail;
