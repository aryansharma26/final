import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, Loader2, Star, Shield, Video, Siren, Stethoscope, MapPin, Building2, Activity, X, ChevronDown, Download } from 'lucide-react';
import { doctorAPI } from '../../api/index.js';
import { Badge, Button, Input, Select, Textarea, Modal, ConfirmDialog, EmptyState, SkeletonRow } from '../components/AdminUI.jsx';
import { exportToExcel } from '../../utils/excelExport.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';

// ─── Searchable Select Component (for large lists: cities, provinces) ───
const SearchableSelect = ({ label, value, onChange, options, placeholder = 'Search...', disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => String(o._id || o.value) === String(value));
  const filtered = query.trim()
    ? options.filter((o) => (o.name || o.label).toLowerCase().includes(query.toLowerCase().trim()))
    : options;

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
    }
  }, [open]);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          className={`w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.name || selected.label : placeholder}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No results found</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o._id || o.value}
                  type="button"
                  onClick={() => handleSelect(o._id || o.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${String(o._id || o.value) === String(value) ? 'bg-brand/5 text-brand font-medium' : 'text-gray-700'}`}
                >
                  {o.name || o.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Stats Card ───
const StatsCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.green}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
};

const DoctorsModule = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '', specialty: '', hospitalClinic: '', region: '', province: '', city: '', address: '',
    phone: '', email: '', consultationFee: '', yearsOfExperience: '', availableDays: [],
    availableHours: '', teleconsultation: false, isVerified: false, isFeatured: false, isEmergency: false,
    googleMapsUrl: '', about: '', education: '', isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const params = { limit: 10000, export: 'true' };
      if (search) params.search = search;
      
      const { data } = await doctorAPI.getAllDoctorsAdmin(params);
      const allDoctors = data.doctors || [];

      const headers = [
        'Name',
        'Email',
        'Phone',
        'Specialization',
        'Hospital/Clinic',
        'Consultation Fee',
        'Experience (Years)',
        'Emergency Service',
        'Verification Status',
        'Status',
        'Joined Date'
      ];

      const mapper = (d) => [
        d.name || '',
        d.email || '',
        d.phone || '',
        d.specialty?.name || '',
        d.hospitalClinic || '',
        d.consultationFee || 0,
        d.yearsOfExperience || 0,
        d.isEmergency ? 'Yes' : 'No',
        d.isVerified ? 'Verified' : 'Unverified',
        d.isActive !== false ? 'Active' : 'Inactive',
        d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''
      ];

      await exportToExcel(allDoctors, headers, mapper, 'doctors_export', 'Doctors');
    } catch (err) {
      console.error('Failed to export doctors:', err);
      setMessage('Failed to export Excel file');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };
  const [tab, setTab] = useState('doctors');
  const [stats, setStats] = useState({ doctors: 0, regions: 0, provinces: 0, cities: 0, specialties: 0 });
  const [showStats, setShowStats] = useState(true);

  const loadDoctors = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 12 };
      if (search) params.search = search;
      const { data } = await doctorAPI.getAllDoctorsAdmin(params);
      const nextDoctors = data.doctors || [];
      setDoctors((prev) => (append ? [...prev, ...nextDoctors] : nextDoctors));
      setPage(pageNum);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadFilters = useCallback(async () => {
    try {
      const [specRes, regionRes] = await Promise.all([
        doctorAPI.getAllSpecialtiesAdmin(),
        doctorAPI.getAllRegionsAdmin(),
      ]);
      setSpecialties(specRes.data.specialties || []);
      setRegions(regionRes.data.regions || []);
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [docRes, regRes, provRes, cityRes, specRes] = await Promise.all([
        doctorAPI.getAllDoctorsAdmin({ limit: 1 }),
        doctorAPI.getAllRegionsAdmin(),
        doctorAPI.getAllProvincesAdmin(),
        doctorAPI.getAllCitiesAdmin(),
        doctorAPI.getAllSpecialtiesAdmin(),
      ]);
      setStats({
        doctors: docRes.data.pagination?.total || 0,
        regions: regRes.data.regions?.length || 0,
        provinces: provRes.data.provinces?.length || 0,
        cities: cityRes.data.cities?.length || 0,
        specialties: specRes.data.specialties?.length || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const loadProvinces = async (regionId) => {
    if (!regionId) { setProvinces([]); return; }
    try {
      const res = await doctorAPI.getProvincesByRegion(regionId);
      setProvinces(res.data.provinces || []);
    } catch { setProvinces([]); }
  };

  const loadCities = async (provinceId) => {
    if (!provinceId) { setCities([]); return; }
    try {
      const res = await doctorAPI.getCitiesByProvince(provinceId);
      setCities(res.data.cities || []);
    } catch { setCities([]); }
  };

  useEffect(() => { loadDoctors(1, false); loadFilters(); loadStats(); }, [loadDoctors, loadFilters, loadStats]);

  const hasMore = page < totalPages;
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadDoctors(page + 1, true);
  }, [hasMore, loading, loadDoctors, page]);

  const loadMoreRef = useInfiniteScroll({
    enabled: hasMore,
    loading,
    onLoadMore: loadMore,
  });

  useEffect(() => {
    if (formData.region && !editingDoctor) { loadProvinces(formData.region); setFormData((p) => ({ ...p, province: '', city: '' })); }
  }, [formData.region]);

  useEffect(() => {
    if (formData.province && !editingDoctor) { loadCities(formData.province); setFormData((p) => ({ ...p, city: '' })); }
  }, [formData.province]);

  const openCreate = () => {
    setEditingDoctor(null);
    setFormData({
      name: '', specialty: '', hospitalClinic: '', region: '', province: '', city: '', address: '',
      phone: '', email: '', consultationFee: '', yearsOfExperience: '', availableDays: [],
      availableHours: '', teleconsultation: false, isVerified: false, isFeatured: false, isEmergency: false,
      googleMapsUrl: '', about: '', education: '', isActive: true,
    });
    setImageFile(null);
    setImagePreview('');
    setProvinces([]);
    setCities([]);
    setModalOpen(true);
    setMessage('');
  };

  const openEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name || '', specialty: doctor.specialty?._id || '', hospitalClinic: doctor.hospitalClinic || '',
      region: doctor.region?._id || '', province: doctor.province?._id || '', city: doctor.city?._id || '',
      address: doctor.address || '', phone: doctor.phone || '', email: doctor.email || '',
      consultationFee: doctor.consultationFee || '', yearsOfExperience: doctor.yearsOfExperience || '',
      availableDays: doctor.availableDays || [], availableHours: doctor.availableHours || '',
      teleconsultation: doctor.teleconsultation || false, isVerified: doctor.isVerified || false,
      isFeatured: doctor.isFeatured || false, isEmergency: doctor.isEmergency || false,
      googleMapsUrl: doctor.googleMapsUrl || '', about: doctor.about || '', education: doctor.education || '',
      isActive: doctor.isActive !== false,
    });
    setImageFile(null);
    setImagePreview(doctor.profilePhoto || '');
    if (doctor.region?._id) loadProvinces(doctor.region._id);
    if (doctor.province?._id) loadCities(doctor.province._id);
    setModalOpen(true);
    setMessage('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const closeModal = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage('');
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) payload.append(key, JSON.stringify(value));
          else payload.append(key, String(value));
        }
      });
      if (imageFile) payload.append('profilePhoto', imageFile);
      if (editingDoctor) {
        await doctorAPI.updateDoctor(editingDoctor._id, payload);
        setMessage('Doctor updated successfully');
      } else {
        await doctorAPI.createDoctor(payload);
        setMessage('Doctor created successfully');
      }
      setTimeout(() => { closeModal(); loadDoctors(1, false); loadStats(); }, 800);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await doctorAPI.deleteDoctor(deleteId);
      setDeleteId(null);
      loadDoctors(1, false);
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const renderTabs = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {['doctors', 'specialties', 'regions', 'provinces', 'cities'].map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            tab === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );

  if (tab !== 'doctors') return <LocationManagement tab={tab} onTabChange={setTab} />;

  return (
    <div>
      {/* Stats Bar */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatsCard icon={Stethoscope} label="Doctors" value={stats.doctors} color="green" />
          <StatsCard icon={MapPin} label="Regions" value={stats.regions} color="blue" />
          <StatsCard icon={Building2} label="Provinces" value={stats.provinces} color="purple" />
          <StatsCard icon={Activity} label="Cities" value={stats.cities} color="orange" />
          <StatsCard icon={Shield} label="Specialties" value={stats.specialties} color="red" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Doctors</h2>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showStats ? 'Hide stats' : 'Show stats'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search doctors..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <button onClick={openCreate} className="pressable flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark cursor-pointer">
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="pressable inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark focus:outline-none transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer h-[38px]"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-white/80" />
            )}
            Export Excel
          </button>
        </div>
      </div>

      {renderTabs()}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <tbody>
              <SkeletonRow cols={6} count={6} />
            </tbody>
          </table>
        </div>
      ) : doctors.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl border border-brand/10 p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Stethoscope className="w-8 h-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Your doctors directory is empty. Add your first doctor to help patients find and book appointments with healthcare professionals.
            </p>
            <button
              onClick={openCreate}
              className="pressable inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Your First Doctor
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-brand">{stats.regions}</p>
              <p className="text-xs text-gray-500">Regions ready</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-brand">{stats.provinces}</p>
              <p className="text-xs text-gray-500">Provinces ready</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-brand">{stats.cities}</p>
              <p className="text-xs text-gray-500">Cities ready</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Doctor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Specialty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        <img src={doctor.profilePhoto || '/doctor-placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doctor.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {doctor.rating?.toFixed(1) || '0.0'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doctor.specialty?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{doctor.city?.name}, {doctor.province?.name}</td>
                  <td className="px-4 py-3 text-gray-600">₱{doctor.consultationFee}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {doctor.isActive && <Badge color="green">Active</Badge>}
                      {doctor.isVerified && <Badge color="blue">Verified</Badge>}
                      {doctor.isFeatured && <Badge color="purple">Featured</Badge>}
                      {doctor.isEmergency && <Badge color="red">Emergency</Badge>}
                      {doctor.teleconsultation && <Badge color="teal">Tele</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(doctor)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(doctor._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(hasMore || loading) && (
            <div ref={loadMoreRef} className="flex min-h-14 items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more...
                </>
              ) : (
                'Scroll to load more'
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingDoctor ? 'Edit Doctor' : 'Add Doctor'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {message && (
            <div className={`p-3 text-sm rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Select label="Specialty" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} required>
              <option value="">Select Specialty</option>
              {specialties.map((s) => <option key={String(s._id)} value={String(s._id)}>{s.name}</option>)}
            </Select>
            <Input label="Hospital / Clinic" value={formData.hospitalClinic} onChange={(e) => setFormData({ ...formData, hospitalClinic: e.target.value })} required />
            <Select label="Region" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value, province: '', city: '' })} required>
              <option value="">Select Region</option>
              {regions.map((r) => <option key={String(r._id)} value={String(r._id)}>{r.name}</option>)}
            </Select>
            <Select label="Province" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value, city: '' })} required>
              <option value="">Select Province</option>
              {provinces.map((p) => <option key={String(p._id)} value={String(p._id)}>{p.name}</option>)}
            </Select>
            <SearchableSelect
              label="City / Municipality"
              value={formData.city}
              onChange={(v) => setFormData({ ...formData, city: v })}
              options={cities}
              placeholder={formData.province ? (cities.length > 0 ? 'Search city...' : 'Loading cities...') : 'Select province first'}
              disabled={!formData.province || cities.length === 0}
            />
            <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" />
            <Input label="Consultation Fee (₱)" value={formData.consultationFee} onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })} type="number" required />
            <Input label="Years of Experience" value={formData.yearsOfExperience} onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })} type="number" required />
            <Input label="Available Hours" value={formData.availableHours} onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })} placeholder="e.g. 9:00 AM - 5:00 PM" />
            <Input label="Google Maps URL" value={formData.googleMapsUrl} onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Days</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    formData.availableDays.includes(day) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Textarea label="About Doctor" value={formData.about} onChange={(e) => setFormData({ ...formData, about: e.target.value })} rows={3} />
            <Textarea label="Education & Training" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Photo</label>
            <div className="flex items-center gap-3">
              {imagePreview && (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" /> Upload Photo
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={formData.teleconsultation} onChange={(e) => setFormData({ ...formData, teleconsultation: e.target.checked })} />
              Teleconsultation Available
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={formData.isVerified} onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })} />
              Verified
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={formData.isEmergency} onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })} />
              Emergency Doctor
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingDoctor ? 'Update Doctor' : 'Create Doctor'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone."
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

// ─── Location Management (Regions, Provinces, Cities) & Specialties ───

const LocationManagement = ({ tab, onTabChange }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', region: '', province: '', order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      switch (tab) {
        case 'specialties': res = await doctorAPI.getAllSpecialtiesAdmin(); break;
        case 'regions': res = await doctorAPI.getAllRegionsAdmin(); break;
        case 'provinces': res = await doctorAPI.getAllProvincesAdmin(); break;
        case 'cities': res = await doctorAPI.getAllCitiesAdmin(); break;
        default: return;
      }
      setItems(res.data[tab] || res.data.provinces || res.data.cities || res.data.specialties || res.data.regions || []);
      if (tab === 'provinces' || tab === 'cities') {
        const regionRes = await doctorAPI.getAllRegionsAdmin();
        setRegions(regionRes.data.regions || []);
      }
      if (tab === 'cities') {
        const provinceRes = await doctorAPI.getAllProvincesAdmin();
        setProvinces(provinceRes.data.provinces || []);
      }
    } catch (err) {
      console.error(`Failed to load ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', region: '', province: '', order: 0 });
    setModalOpen(true);
    setMessage('');
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      region: item.region?._id || item.region || '',
      province: item.province?._id || item.province || '',
      order: item.order || 0,
    });
    setModalOpen(true);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...formData };
      if (editingItem) {
        switch (tab) {
          case 'specialties': await doctorAPI.updateSpecialty(editingItem._id, payload); break;
          case 'regions': await doctorAPI.updateRegion(editingItem._id, payload); break;
          case 'provinces': await doctorAPI.updateProvince(editingItem._id, payload); break;
          case 'cities': await doctorAPI.updateCity(editingItem._id, payload); break;
        }
        setMessage('Updated successfully');
      } else {
        switch (tab) {
          case 'specialties': await doctorAPI.createSpecialty(payload); break;
          case 'regions': await doctorAPI.createRegion(payload); break;
          case 'provinces': await doctorAPI.createProvince(payload); break;
          case 'cities': await doctorAPI.createCity(payload); break;
        }
        setMessage('Created successfully');
      }
      setTimeout(() => { setModalOpen(false); loadData(); }, 800);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      switch (tab) {
        case 'specialties': await doctorAPI.deleteSpecialty(deleteId); break;
        case 'regions': await doctorAPI.deleteRegion(deleteId); break;
        case 'provinces': await doctorAPI.deleteProvince(deleteId); break;
        case 'cities': await doctorAPI.deleteCity(deleteId); break;
      }
      setDeleteId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">{tabLabel}</h2>
        <button onClick={openCreate} className="pressable flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark">
          <Plus className="w-4 h-4" /> Add {tabLabel.slice(0, -1)}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {['doctors', 'specialties', 'regions', 'provinces', 'cities'].map((t) => (
          <button key={t} onClick={() => onTabChange(t)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              tab === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <tbody>
              <SkeletonRow cols={6} count={6} />
            </tbody>
          </table>
        </div>
      ) : items.length === 0 ? (
        <EmptyState message={`No ${tab} found`} action={`Add your first ${tab.slice(0, -1)}`} onAction={openCreate} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                {(tab === 'provinces' || tab === 'cities') && <th className="text-left px-4 py-3 font-medium text-gray-500">Region</th>}
                {tab === 'cities' && <th className="text-left px-4 py-3 font-medium text-gray-500">Province</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  {(tab === 'provinces' || tab === 'cities') && <td className="px-4 py-3 text-gray-600">{item.region?.name || item.region?.name || '-'}</td>}
                  {tab === 'cities' && <td className="px-4 py-3 text-gray-600">{item.province?.name || item.province?.name || '-'}</td>}
                  <td className="px-4 py-3 text-gray-600">{item.order || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="pressable p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(item._id)} className="pressable p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? `Edit ${tabLabel.slice(0, -1)}` : `Add ${tabLabel.slice(0, -1)}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 text-sm rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>
          )}
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          {(tab === 'provinces' || tab === 'cities') && (
            <Select label="Region" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} required>
              <option value="">Select Region</option>
              {regions.map((r) => <option key={String(r._id)} value={String(r._id)}>{r.name}</option>)}
            </Select>
          )}
          {tab === 'cities' && (
            <SearchableSelect
              label="Province"
              value={formData.province}
              onChange={(v) => setFormData({ ...formData, province: v })}
              options={provinces}
              placeholder="Search province..."
              disabled={!formData.region}
            />
          )}
          <Input label="Order" value={String(formData.order)} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} type="number" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title={`Delete ${tabLabel.slice(0, -1)}`}
        message={`Are you sure you want to delete this ${tab.slice(0, -1)}?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default DoctorsModule;
