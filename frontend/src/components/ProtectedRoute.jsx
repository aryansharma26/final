import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center animate-pulse">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
