import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, Star, LogOut, Menu, Stethoscope, FolderTree, FileText, Building2, Percent
} from 'lucide-react';
import { adminAPI } from '../api/index.js';
import DashboardModule from '../admin/modules/DashboardModule.jsx';
import ProductsModule from '../admin/modules/ProductsModule.jsx';
import OrdersModule from '../admin/modules/OrdersModule.jsx';
import UsersModule from '../admin/modules/UsersModule.jsx';
import ReviewsModule from '../admin/modules/ReviewsModule.jsx';
import ContactsModule from '../admin/modules/ContactsModule.jsx';
import DoctorsModule from '../admin/modules/DoctorsModule.jsx';
import CategoriesModule from '../admin/modules/CategoriesModule.jsx';
import PrescriptionsModule from '../admin/modules/PrescriptionsModule.jsx';
import B2BModule from '../admin/modules/B2BModule.jsx';
import B2BProductsModule from '../admin/modules/B2BProductsModule.jsx';
import SettingsModule from '../admin/modules/SettingsModule.jsx';
import CategoryPurchaseReportModule from '../admin/modules/CategoryPurchaseReportModule.jsx';
import B2BPurchaseReportModule from '../admin/modules/B2BPurchaseReportModule.jsx';
import logo from '../assets/logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getDashboard();
      setStats(data.stats);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminAPI.logout();
    } catch {
      // Ignore logout errors and return to login.
    }
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'settings', label: 'Offers', icon: Percent },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'orders', label: 'Orders (B2C)', icon: ShoppingCart },
    { id: 'b2b-orders', label: 'B2B Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'category-purchase-report', label: 'Retail Category Report', icon: FolderTree },
    { id: 'b2b-purchase-report', label: 'B2B Purchase Report', icon: Building2 },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'b2b-products', label: 'B2B Products', icon: Package },
    { id: 'b2b', label: 'B2B Enquiries', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: MessageSquare },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardModule stats={stats} loading={loading} setActiveTab={setActiveTab} />;
      case 'categories': return <CategoriesModule />;
      case 'products': return <ProductsModule />;
      case 'prescriptions': return <PrescriptionsModule />;
      case 'orders': return <OrdersModule defaultTypeFilter="b2c" hideTypeFilter={true} />;
      case 'b2b-orders': return <OrdersModule defaultTypeFilter="b2b" hideTypeFilter={true} />;
      case 'users': return <UsersModule />;
      case 'category-purchase-report': return <CategoryPurchaseReportModule />;
      case 'b2b-purchase-report': return <B2BPurchaseReportModule />;
      case 'reviews': return <ReviewsModule />;
      case 'doctors': return <DoctorsModule />;
      case 'b2b-products': return <B2BProductsModule />;
      case 'b2b': return <B2BModule />;
      case 'contacts': return <ContactsModule />;
      case 'settings': return <SettingsModule />;
      default: return <DashboardModule stats={stats} loading={loading} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-dark text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        className={`w-64 bg-dark text-white fixed h-full overflow-y-auto z-40 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white">
              <img src={logo} alt="Capsandpills" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold">Admin Dashboard</span>
          </Link>
        </div>
        <nav className="px-3 pb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-1 ${
                activeTab === tab.id ? 'bg-brand text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mt-4"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </nav>
      </aside>

      <main className={`flex-1 h-full overflow-y-auto p-8 min-w-0 transition-all ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-64'}`}>
        {renderTab()}
      </main>
    </div>
  );
};

export default AdminDashboard;
