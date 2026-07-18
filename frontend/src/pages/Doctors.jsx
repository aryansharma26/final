import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Star, Phone, Stethoscope, Filter, X, ChevronLeft, User, Clock, Shield, Video, Siren, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { doctorAPI } from '../api/index.js';
import { getPageState, setPageState } from '../utils/pageCache.js';

const DOCTORS_PAGE_SIZE = 12;

const Doctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const cacheKey = location.pathname + location.search;
  const cachedState = getPageState(cacheKey);

  const [doctors, setDoctors] = useState(() => cachedState?.doctors || []);
  const [loading, setLoading] = useState(() => (cachedState ? false : true));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(() => cachedState?.pagination || { page: 1, limit: DOCTORS_PAGE_SIZE, total: 0, pages: 1 });
  const loadMoreRef = useRef(null);
  const loadRequestRef = useRef(0);
  const isFirstRender = useRef(true);

  const [specialties, setSpecialties] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const openContactModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowContactModal(true);
  };

  const searchQuery = searchParams.get('search') || '';
  const specialtyFilter = searchParams.get('specialty') || '';
  const regionFilter = searchParams.get('region') || '';
  const provinceFilter = searchParams.get('province') || '';
  const cityFilter = searchParams.get('city') || '';
  const hospitalFilter = searchParams.get('hospital') || '';
  const teleconsultationFilter = searchParams.get('teleconsultation') || '';
  const verifiedFilter = searchParams.get('verified') || '';
  const emergencyFilter = searchParams.get('emergency') || '';
  const sortBy = searchParams.get('sort') || '';

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [hospitalInput, setHospitalInput] = useState(hospitalFilter);

  const loadDoctors = useCallback(async (pageToLoad = 1, append = false) => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      const params = {
        page: pageToLoad,
        limit: DOCTORS_PAGE_SIZE,
        ...(searchQuery && { search: searchQuery }),
        ...(specialtyFilter && { specialty: specialtyFilter }),
        ...(regionFilter && { region: regionFilter }),
        ...(provinceFilter && { province: provinceFilter }),
        ...(cityFilter && { city: cityFilter }),
        ...(hospitalFilter && { hospital: hospitalFilter }),
        ...(teleconsultationFilter === 'true' && { teleconsultation: 'true' }),
        ...(verifiedFilter === 'true' && { verified: 'true' }),
        ...(emergencyFilter === 'true' && { emergency: 'true' }),
        ...(sortBy && { sort: sortBy }),
      };
      const { data } = await doctorAPI.getDoctors(params);
      if (requestId !== loadRequestRef.current) return;

      const nextDoctors = data.doctors || [];
      setDoctors((prev) => {
        if (!append) return nextDoctors;
        const existingIds = new Set(prev.map((doctor) => doctor._id));
        return [...prev, ...nextDoctors.filter((doctor) => !existingIds.has(doctor._id))];
      });
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [searchQuery, specialtyFilter, regionFilter, provinceFilter, cityFilter, hospitalFilter, teleconsultationFilter, verifiedFilter, emergencyFilter, sortBy]);

  const loadFilters = useCallback(async () => {
    try {
      const [specRes, regionRes] = await Promise.all([
        doctorAPI.getSpecialties(),
        doctorAPI.getRegions(),
      ]);
      setSpecialties(specRes.data.specialties || []);
      setRegions(regionRes.data.regions || []);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  }, []);

  useEffect(() => {
    if (!regionFilter) { setProvinces([]); setCities([]); return; }
    doctorAPI.getProvincesByRegion(regionFilter)
      .then((res) => setProvinces(res.data.provinces || []))
      .catch(() => setProvinces([]));
  }, [regionFilter]);

  useEffect(() => {
    if (!provinceFilter) { setCities([]); return; }
    doctorAPI.getCitiesByProvince(provinceFilter)
      .then((res) => setCities(res.data.cities || []))
      .catch(() => setCities([]));
  }, [provinceFilter]);

  const lastLoadedKeyRef = useRef(cachedState ? cacheKey : null);

  useEffect(() => {
    // If the cacheKey is the one we already have loaded in state, do nothing!
    if (lastLoadedKeyRef.current === cacheKey) {
      return;
    }
    
    lastLoadedKeyRef.current = cacheKey;
    
    // If we have a cached state for this new cacheKey, restore it instead of fetching page 1!
    const state = getPageState(cacheKey);
    if (state) {
      setDoctors(state.doctors);
      setPagination(state.pagination);
      setLoading(false);
      return;
    }

    loadDoctors(1, false);
  }, [loadDoctors, cacheKey]);

  // Keep page cache in sync
  useEffect(() => {
    if (!loading && doctors.length > 0) {
      setPageState(cacheKey, { doctors, pagination });
    }
  }, [doctors, pagination, cacheKey, loading]);

  useEffect(() => { loadFilters(); }, [loadFilters]);

  const hasMoreDoctors = pagination.page < pagination.pages && doctors.length < pagination.total;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || !hasMoreDoctors) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadDoctors(pagination.page + 1, true);
        }
      },
      { rootMargin: '360px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreDoctors, loadDoctors, loading, loadingMore, pagination.page]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete('page');
    if (key === 'region') { newParams.delete('province'); newParams.delete('city'); }
    if (key === 'province') newParams.delete('city');
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || undefined);
  };

  const handleHospitalSearch = (e) => {
    e.preventDefault();
    updateParam('hospital', hospitalInput.trim() || undefined);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput('');
    setHospitalInput('');
  };

  const hasActiveFilters =
    searchQuery || specialtyFilter || regionFilter || provinceFilter || cityFilter ||
    hospitalFilter || teleconsultationFilter || verifiedFilter || emergencyFilter || sortBy;

  const activeFilterCount = [
    searchQuery, specialtyFilter, regionFilter, provinceFilter, cityFilter,
    hospitalFilter, teleconsultationFilter, verifiedFilter, emergencyFilter, sortBy,
  ].filter(Boolean).length;

  const getSortLabel = () => {
    if (sortBy === 'rating') return 'Highest Rated';
    if (sortBy === 'experience') return 'Most Experienced';
    if (sortBy === 'name') return 'Alphabetical A-Z';
    return 'Default';
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
      <span className="text-sm font-medium text-gray-700">{rating?.toFixed(1) || '0.0'}</span>
    </div>
  );

  return (
    <div className="container-custom py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-7 h-7 text-brand" />
          Find Doctors
        </h1>
        <p className="text-gray-500 text-sm mt-1">Search and book appointments with trusted healthcare professionals</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search by doctor name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-brand text-brand bg-brand/5">
          <Filter className="w-4 h-4" />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => updateParam('sort', e.target.value || undefined)}
            className="appearance-none px-3 py-2 pr-8 text-sm font-medium border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
          >
            <option value="">Sort: Default</option>
            <option value="rating">Highest Rated</option>
            <option value="experience">Most Experienced</option>
            <option value="name">Alphabetical A-Z</option>
          </select>
          <ChevronLeft className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <X className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {/* Filters Panel — Always Visible */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Specialty</label>
          <select
            value={specialtyFilter}
            onChange={(e) => updateParam('specialty', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
          >
            <option value="">All Specialties</option>
            {specialties.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Region</label>
          <select
            value={regionFilter}
            onChange={(e) => updateParam('region', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
          >
            <option value="">All Regions</option>
            {regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Province</label>
          <select
            value={provinceFilter}
            onChange={(e) => updateParam('province', e.target.value || undefined)}
            disabled={!regionFilter}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">All Provinces</option>
            {provinces.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">City / Municipality</label>
          <select
            value={cityFilter}
            onChange={(e) => updateParam('city', e.target.value || undefined)}
            disabled={!provinceFilter}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">All Cities</option>
            {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Hospital / Clinic</label>
          <form onSubmit={handleHospitalSearch} className="flex gap-2">
            <input
              type="text" placeholder="Search by clinic or hospital name..."
              value={hospitalInput}
              onChange={(e) => setHospitalInput(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <button type="submit" className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl">Search</button>
          </form>
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <button
            onClick={() => updateParam('teleconsultation', teleconsultationFilter === 'true' ? undefined : 'true')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
              teleconsultationFilter === 'true' ? 'border-brand text-brand bg-brand/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Teleconsultation
          </button>
          <button
            onClick={() => updateParam('verified', verifiedFilter === 'true' ? undefined : 'true')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
              verifiedFilter === 'true' ? 'border-brand text-brand bg-brand/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Verified Only
          </button>
          <button
            onClick={() => updateParam('emergency', emergencyFilter === 'true' ? undefined : 'true')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
              emergencyFilter === 'true' ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Siren className="w-3.5 h-3.5" /> Emergency
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

      {!loading && hasActiveFilters && (
        <p className="text-sm text-gray-500 mb-4">
          {pagination.total} doctor{pagination.total !== 1 ? 's' : ''} found
          {sortBy && ` · Sorted by ${getSortLabel()}`}
        </p>
      )}

      {loading && doctors.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-3" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-1">No doctors found matching your filters</p>
          <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group">
                <Link
                  to={`/doctors/${doctor.slug}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                  aria-label={`View ${doctor.name}`}
                />
                <div className="relative mb-3">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'}
                      alt={doctor.name} className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-0 right-0 flex flex-col gap-1">
                    {doctor.isEmergency && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                        <Siren className="w-2.5 h-2.5" /> Emergency
                      </span>
                    )}
                    {doctor.teleconsultation && (
                      <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-full flex items-center gap-0.5">
                        <Video className="w-2.5 h-2.5" /> Tele
                      </span>
                    )}
                    {doctor.isVerified && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{doctor.name}</h3>
                  <p className="text-xs text-brand font-medium mt-0.5">{doctor.specialty?.name}</p>
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    {renderStars(doctor.rating)}
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {doctor.yearsOfExperience} yrs
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {doctor.city?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{doctor.hospitalClinic}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">Consultation Fee</p>
                  <p className="font-bold text-gray-900 text-sm">₱{doctor.consultationFee}</p>
                </div>

                <div className="mt-3 flex gap-2 relative z-10">
                  <Link to={`/doctors/${doctor.slug}`} className="flex-1 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-medium rounded-xl text-center transition-colors">
                    View Details
                  </Link>
                  {doctor.phone && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openContactModal(doctor); }}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      title="Contact Doctor"
                    >
                      <Phone className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div ref={loadMoreRef} className="mt-8 min-h-12">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more doctors...
              </div>
            )}
            {!hasMoreDoctors && doctors.length > 0 && (
              <p className="py-4 text-center text-sm text-gray-400">All doctors loaded</p>
            )}
          </div>
          {loadingMore && (
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-3" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showContactModal && selectedDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowContactModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Contact {selectedDoctor.name}</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selectedDoctor.phone && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                  <a
                    href={`tel:${selectedDoctor.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-brand" />
                    <span className="flex-1 text-sm font-medium text-gray-900">{selectedDoctor.phone}</span>
                  </a>
                </div>
              )}
              {selectedDoctor.email && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                  <a
                    href={`mailto:${selectedDoctor.email}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-brand" />
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{selectedDoctor.email}</span>
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

export default Doctors;
