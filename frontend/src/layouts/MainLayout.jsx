import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
// import FloatingContactButtons from '../components/FloatingContactButtons';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FloatingMessenger from '../components/FloatingMessenger';
import FloatingViber from '../components/FloatingViber';
import CoreQuickActions from '../components/CoreQuickActions';
import { useSettings } from '../contexts/SettingsContext.jsx';

const MainLayout = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuth = ['/login', '/register', '/forgot-password', '/reset-password'].some((p) => location.pathname.startsWith(p));
  const { banner } = useSettings();
  const showBanner = banner && banner.show;

  if (isAdmin || isAuth) {
    return <Outlet />;
  }

  const isPop = navigationType === 'POP';
  const isHome = location.pathname === '/';
  const outletKey = `${location.pathname}${location.search}`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className={`flex-1 ${showBanner ? 'pt-[94px] lg:pt-[156px]' : 'pt-[54px] lg:pt-[120px]'}`}>
        <Outlet />
      </main>
      <Footer />
      {/* <FloatingContactButtons /> */}
      <FloatingWhatsApp />
      <FloatingMessenger />
      <FloatingViber />
      <CoreQuickActions />
    </div>
  );
};

export default MainLayout;
