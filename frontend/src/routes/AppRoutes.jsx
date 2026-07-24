import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminProtectedRoute from '../components/AdminProtectedRoute';

import Home from '../pages/Home';
import Medicines from '../pages/Medicines';
import Offers from '../pages/Offers';
import FAQ from '../pages/FAQ';
import Doctors from '../pages/Doctors';
import DoctorDetail from '../pages/DoctorDetail';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderDetail from '../pages/OrderDetail';
import Profile from '../pages/Profile';
import Wishlist from '../pages/Wishlist';
import Orders from '../pages/Orders';
import Prescriptions from '../pages/Prescriptions';
import B2BEnquiry from '../pages/B2BEnquiry';
import B2BProductDetail from '../pages/B2BProductDetail';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import NotFound from '../pages/NotFound';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FloatingMessenger from '../components/FloatingMessenger';
import FloatingViber from '../components/FloatingViber';
import CoreQuickActions from '../components/CoreQuickActions';

const AdminLogin = lazy(() => import('../pages/AdminLogin'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const About = lazy(() => import('../pages/About'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const Terms = lazy(() => import('../pages/Terms'));
const RefundPolicy = lazy(() => import('../pages/RefundPolicy'));
const ShippingPolicy = lazy(() => import('../pages/ShippingPolicy'));
const Credits = lazy(() => import('../pages/Credits'));
const Careers = lazy(() => import('../pages/Careers'));
const Blog = lazy(() => import('../pages/Blog'));
const Partners = lazy(() => import('../pages/Partners'));
const ContactUs = lazy(() => import('../pages/ContactUs'));
const LabTests = lazy(() => import('../pages/LabTests'));
const HealthArticles = lazy(() => import('../pages/HealthArticles'));
const Insurance = lazy(() => import('../pages/Insurance'));
const CorporateWellness = lazy(() => import('../pages/CorporateWellness'));
const CookiePolicy = lazy(() => import('../pages/CookiePolicy'));
const Disclaimer = lazy(() => import('../pages/Disclaimer'));
const DoctorConsultation = lazy(() => import('../pages/DoctorConsultation'));

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
  </div>
);

const RedirectWithQuery = () => {
  const location = useLocation();
  return <Navigate to={`/medicines${location.search}`} replace />;
};

const AppRoutes = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  const isPop = navigationType === 'POP';
  const motionKey = `${location.pathname}${location.search}_${location.key || 'def'}_${navigationType}`;
  const showFloatingContacts = !location.pathname.startsWith('/admin') &&
    !['/login', '/register', '/forgot-password', '/reset-password'].some((p) => location.pathname.startsWith(p));

  return (
    <>
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: isPop ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <Routes location={location}>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/healthcare" element={<RedirectWithQuery />} />
        <Route path="/about" element={<Suspense fallback={<RouteLoader />}><About /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<RouteLoader />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<RouteLoader />}><Terms /></Suspense>} />
        <Route path="/refund-policy" element={<Suspense fallback={<RouteLoader />}><RefundPolicy /></Suspense>} />
        <Route path="/shipping-policy" element={<Suspense fallback={<RouteLoader />}><ShippingPolicy /></Suspense>} />
        <Route path="/credits" element={<Suspense fallback={<RouteLoader />}><Credits /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<RouteLoader />}><Careers /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<RouteLoader />}><Blog /></Suspense>} />
        <Route path="/partners" element={<Suspense fallback={<RouteLoader />}><Partners /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<RouteLoader />}><ContactUs /></Suspense>} />
        <Route path="/lab-tests" element={<Suspense fallback={<RouteLoader />}><LabTests /></Suspense>} />
        <Route path="/health-articles" element={<Suspense fallback={<RouteLoader />}><HealthArticles /></Suspense>} />
        <Route path="/insurance" element={<Suspense fallback={<RouteLoader />}><Insurance /></Suspense>} />
        <Route path="/corporate-wellness" element={<Suspense fallback={<RouteLoader />}><CorporateWellness /></Suspense>} />
        <Route path="/cookie-policy" element={<Suspense fallback={<RouteLoader />}><CookiePolicy /></Suspense>} />
        <Route path="/disclaimer" element={<Suspense fallback={<RouteLoader />}><Disclaimer /></Suspense>} />
        <Route path="/doctor-consultation" element={<Suspense fallback={<RouteLoader />}><DoctorConsultation /></Suspense>} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:slug" element={<DoctorDetail />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <Wishlist />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/b2b-enquiry" element={<B2BEnquiry />} />
        <Route path="/b2b-product/:slug" element={<B2BProductDetail />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={
        <Suspense fallback={<RouteLoader />}>
          <AdminLogin />
        </Suspense>
      } />
      <Route path="/admin" element={
        <Suspense fallback={<RouteLoader />}>
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        </Suspense>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </motion.div>
    {showFloatingContacts && (
      <>
        <FloatingWhatsApp />
        <FloatingMessenger />
        <FloatingViber />
        <CoreQuickActions />
      </>
    )}
    </>
  );
};

export default AppRoutes;
