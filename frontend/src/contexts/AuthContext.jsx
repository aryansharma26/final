import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, cartAPI } from '../api/index.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          await authAPI.refresh();
          const { data } = await authAPI.getMe();
          setUser(data.user);
        } catch {
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setUser(data.user);
    // Merge guest cart after login
    let guestCart;
    try {
      guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
    } catch {
      guestCart = { items: [] };
    }
    if (guestCart.items.length > 0) {
      try {
        for (const item of guestCart.items) {
          const productId = item.product?._id || item.product;
          if (productId) {
            await cartAPI.addToCart({ productId, quantity: item.quantity || 1 });
          }
        }
        localStorage.removeItem('guestCart');
      } catch (err) {
        console.error('Failed to merge guest cart:', err);
      }
    }
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    setUser(data.user);
    // Merge guest cart after registration
    let guestCart;
    try {
      guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
    } catch {
      guestCart = { items: [] };
    }
    if (guestCart.items.length > 0) {
      try {
        for (const item of guestCart.items) {
          const productId = item.product?._id || item.product;
          if (productId) {
            await cartAPI.addToCart({ productId, quantity: item.quantity || 1 });
          }
        }
        localStorage.removeItem('guestCart');
      } catch (err) {
        console.error('Failed to merge guest cart:', err);
      }
    }
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
