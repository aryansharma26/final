import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Medicines from '../pages/Medicines';
import Offers from '../pages/Offers';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Profile from '../pages/Profile';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderDetail from '../pages/OrderDetail';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import Wishlist from '../pages/Wishlist';
import Orders from '../pages/Orders';
import Prescriptions from '../pages/Prescriptions';
import B2BEnquiry from '../pages/B2BEnquiry';
import B2BProductDetail from '../pages/B2BProductDetail';
import NotFound from '../pages/NotFound';
import Doctors from '../pages/Doctors';
import DoctorDetail from '../pages/DoctorDetail';
import ComingSoon from '../pages/ComingSoon';
import FAQ from '../pages/FAQ';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminProtectedRoute from '../components/AdminProtectedRoute';

const RedirectWithQuery = () => {
  const location = useLocation();
  return <Navigate to={`/medicines${location.search}`} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/healthcare" element={<RedirectWithQuery />} />
        <Route path="/about" element={<ComingSoon />} />
        <Route path="/privacy" element={<ComingSoon />} />
        <Route path="/terms" element={<ComingSoon />} />
        <Route path="/refund-policy" element={<ComingSoon />} />
        <Route path="/shipping-policy" element={<ComingSoon />} />
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
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
