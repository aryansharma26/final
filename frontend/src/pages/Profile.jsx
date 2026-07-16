import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Phone, MapPin, Trash2, Edit2, LogOut, Package, FileText, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userAPI } from '../api/index.js';

const Profile = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
  } = useForm();
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
      resetProfile({
        name: profileUser.name || '',
        phone: profileUser.phone || '',
      });
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setMessage(err.response?.data?.message || 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const onUpdateProfile = async ({ phone, ...data }) => {
    try {
      setMessage('');
      const { data: res } = await userAPI.updateProfile(data);
      updateUser(res.user);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
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
    <div className="container-custom py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Account</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">My Profile</h1>
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
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 lg:w-full lg:justify-start lg:gap-3 lg:px-4"
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link
                to="/prescriptions"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 lg:w-full lg:justify-start lg:gap-3 lg:px-4"
              >
                <FileText className="h-4 w-4" />
                Prescriptions
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 lg:col-span-1 lg:w-full lg:justify-start lg:gap-3 lg:px-4"
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
                  <p className="text-sm text-gray-500">Keep your contact details updated for faster checkout.</p>
                </div>
              </div>
              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    {...registerProfile('name')}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-55 px-4 py-2.5 text-gray-500">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{user.email}</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <div className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500">
                      {user.phone || 'No phone number added'}
                    </div>
                  </div>
                 
                </div>
                <button type="submit" className="w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark sm:w-fit">
                  Save Changes
                </button>
              </form>
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
                    <button type="submit" className="rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark">
                      {editingAddressId ? 'Update Address' : 'Add Address'}
                    </button>
                    {editingAddressId && (
                      <button type="button" onClick={() => { setEditingAddressId(null); resetAddress(); }} className="rounded-xl border border-gray-200 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50">
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
                            <button type="button" onClick={() => { setEditingAddressId(addr._id); resetAddress(addr); }} className="rounded p-1 text-gray-400 transition-colors hover:bg-brand/10 hover:text-brand">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => onDeleteAddress(addr._id)} className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
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
