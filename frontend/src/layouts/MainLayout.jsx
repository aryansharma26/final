import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingContactButtons from '../components/FloatingContactButtons';
import CoreQuickActions from '../components/CoreQuickActions';
import { useSettings } from '../contexts/SettingsContext.jsx';

const MainLayout = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuth = ['/login', '/register', '/forgot-password', '/reset-password'].some((p) => location.pathname.startsWith(p));
  const { banner } = useSettings();
  const showBanner = banner && banner.show;

  if (isAdmin || isAuth) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className={`flex-1 pb-24 lg:pb-0 ${showBanner ? 'pt-[108px] lg:pt-[156px]' : 'pt-[72px] lg:pt-[120px]'}`}>
        <Outlet />
      </main>
      <Footer />
      <FloatingContactButtons />
      <CoreQuickActions />
    </div>
  );
};

export default MainLayout;