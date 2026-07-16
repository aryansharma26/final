import { createContext, useContext, useState, useEffect } from 'react';
import { settingAPI } from '../api/index.js';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [banner, setBanner] = useState(null);
  const [checkoutDiscount, setCheckoutDiscount] = useState(null);
  const [flashDeal, setFlashDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data } = await settingAPI.getPromoBanner();
      if (data.success) {
        setBanner(data.banner);
        setCheckoutDiscount(data.checkoutDiscount);
        setFlashDeal(data.flashDeal);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ banner, setBanner, checkoutDiscount, setCheckoutDiscount, flashDeal, setFlashDeal, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
