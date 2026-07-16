import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../api/index.js';

const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        await adminAPI.getDashboard();
        setIsValid(true);
      } catch (err) {
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    };
    validateToken();
  }, []);

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
