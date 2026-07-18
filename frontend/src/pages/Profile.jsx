import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, User, Phone, MapPin, Trash2, Edit2, LogOut, Package, FileText, Mail, ShieldCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userAPI } from '../api/index.js';

const Profile = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    formState: { errors: addressErrors },
  } = useForm();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/profile', { replace: true });
      return;
    }
    if (user) loadData();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await userAPI.getProfile();
      const profileUser = profileRes.data.user;
      setAddresses(profileUser.addresses || []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setMessage(err.response?.data?.message || 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const onAddAddress = async (data) => {
    try {
      setMessage('');
      if (editingAddressId) {
        const { data: res } = await userAPI.updateAddress(editingAddressId, data);
        setAddresses(res.addresses);
        setEditingAddressId(null);
      } else {
        const { data: res } = await userAPI.addAddress(data);
        setAddresses(res.addresses);
      }
      resetAddress();
      setMessage(editingAddressId ? 'Address updated successfully' : 'Address added successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save address');
    }
  };

  const onDeleteAddress = async (id) => {
    try {
      const { data: res } = await userAPI.deleteAddress(id);
      setAddresses(res.addresses);
    } catch (err) {
      console.error('Failed to delete address:', err);
      setMessage(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/', { replace: true });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  if (!user) return null;

  if (loading) {
    return (
      <div className="container-custom py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-4 lg:gap-8">
          <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
          <div className="space-y-4 lg:col-span-3">
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-5 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="pressable mt-0.5 rounded-xl p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Account</p>
            <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">My Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Profile details and saved addresses</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5 lg:sticky lg:top-24">
            <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 p-3 sm:mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 sm:h-12 sm:w-12">
                <User className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-950">{user.name}</p>
                <p className="truncate text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <nav className="grid grid-cols-2 gap-2 lg:block lg:space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors lg:w-full lg:justify-start lg:gap-3 lg:px-4 ${
                    activeTab === tab.id ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
              <Link
                to="/orders"
                className="pressable flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 lg:w-full lg:justify-start lg:gap-3 lg:px-4"
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link
                to="/prescriptions"
                className="pressable flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 lg:w-full lg:justify-start lg:gap-3 lg:px-4"
              >
                <FileText className="h-4 w-4" />
                Prescriptions
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="pressable col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 lg:col-span-1 lg:w-full lg:justify-start lg:gap-3 lg:px-4"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {message && (
            <div className={`mb-4 rounded-xl p-3 text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-950">Profile Information</h2>
                  <p className="text-sm text-gray-500">Your registered account information is shown below.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <User className="h-4 w-4" />
                    Account Name
                  </div>
                  <p className="text-base font-bold text-gray-950">{user.name || 'Customer'}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                  <p className="truncate text-base font-semibold text-gray-950">{user.email}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="text-base font-semibold text-gray-950">{user.phone || 'No phone number added'}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                    Account Status
                  </div>
                  <p className="text-base font-semibold text-gray-950">{user.isVerified ? 'Verified account' : 'Active account'}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <CalendarDays className="h-4 w-4" />
                    Profile Summary
                  </div>
                  <p className="text-sm leading-6 text-gray-600">
                    Your account details are used for orders, prescriptions, and customer support verification.
                  </p>
                </div>
              </div>
            </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-6 text-xl font-bold text-gray-950">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h2>
                <form onSubmit={handleSubmitAddress(onAddAddress)} className="grid gap-4 sm:grid-cols-2">
                  <input {...registerAddress('name', { required: true })} placeholder="Full Name" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  <input {...registerAddress('phone', { required: true })} placeholder="Phone" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  <input {...registerAddress('addressLine1', { required: true })} placeholder="Address Line 1" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:col-span-2" />
                  <input {...registerAddress('addressLine2')} placeholder="Address Line 2 (Optional)" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:col-span-2" />
                  <input {...registerAddress('barangay')} placeholder="Barangay (Optional)" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  <input {...registerAddress('cityMunicipality', { required: true })} placeholder="City / Municipality" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  <input {...registerAddress('province', { required: true })} placeholder="Province" className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  <div className="flex flex-col">
                    <input {...registerAddress('zipCode', { required: 'Zip Code is required', pattern: { value: /^\d{4}$/, message: 'Zip Code must be exactly 4 digits' } })} placeholder="Zip Code" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                    {addressErrors.zipCode && <span className="text-xs text-red-500 mt-1">{addressErrors.zipCode.message}</span>}
                  </div>
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input {...registerAddress('isDefault')} type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-600">Set as default address</span>
                  </label>
                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                    <button type="submit" className="pressable rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark">
                      {editingAddressId ? 'Update Address' : 'Add Address'}
                    </button>
                    {editingAddressId && (
                      <button type="button" onClick={() => { setEditingAddressId(null); resetAddress(); }} className="pressable rounded-xl border border-gray-200 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-6 text-xl font-bold text-gray-950">Saved Addresses</h2>
                {addresses.length === 0 ? (
                  <p className="rounded-2xl bg-gray-50 py-8 text-center text-gray-500">No addresses saved yet</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div key={addr._id} className={`rounded-xl border p-4 ${addr.isDefault ? 'border-brand bg-brand/5' : 'border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{addr.name}</p>
                            <p className="text-sm text-gray-555">{addr.phone}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => { setEditingAddressId(addr._id); resetAddress(addr); }} className="pressable rounded p-1 text-gray-400 transition-colors hover:bg-brand/10 hover:text-brand">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => onDeleteAddress(addr._id)} className="pressable rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}{addr.barangay ? `, ${addr.barangay}` : ''}</p>
                        <p className="text-sm text-gray-600">{addr.cityMunicipality}, {addr.province} - {addr.zipCode}</p>
                        {addr.isDefault && (
                          <span className="mt-2 inline-block rounded bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Default</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
