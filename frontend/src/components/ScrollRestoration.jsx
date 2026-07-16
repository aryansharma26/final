import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'scroll-positions';

function getStored() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function setStored(positions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

export default function ScrollRestoration() {
  const { key, pathname } = useLocation();
  const positions = useRef(getStored());
  const prevKeyRef = useRef(null);
  const prevPathRef = useRef(null);
  const scrollYRef = useRef(0);
  const timerRef = useRef(null);
  const lastRestoreYRef = useRef(-1);

  // Disable native scroll restoration
  useEffect(() => {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Save position on scroll (never cancels the restore timer)
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      scrollYRef.current = y;
      positions.current[key] = y;
      setStored(positions.current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);

  // Restore scroll position on route change
  useEffect(() => {
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      prevPathRef.current = pathname;
      return;
    }

    if (prevKeyRef.current === key) return;

    // Cancel any previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Save the position of the page we're LEAVING (by pathname)
    positions.current[prevPathRef.current] = scrollYRef.current;
    setStored(positions.current);

    prevKeyRef.current = key;
    prevPathRef.current = pathname;

    // Product pages always open at top
    if (pathname.startsWith('/product/')) {
      window.scrollTo(0, 0);
      return;
    }

    const saved = positions.current[key] ?? positions.current[pathname];

    if (saved === undefined || saved <= 0) {
      window.scrollTo(0, 0);
      return;
    }

    // Restore with retry for dynamic content.
    // Stop when: (1) page is tall enough AND we're at target, OR (2) user manually scrolled.
    const targetY = saved;
    lastRestoreYRef.current = -1;

    const tryRestore = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentY = window.scrollY;

      // Success: page is tall enough AND we're at the target
      if (maxScroll >= targetY && Math.abs(currentY - targetY) <= 5) {
        timerRef.current = null;
        return;
      }

      // User manually scrolled away from our restored position — stop
      if (lastRestoreYRef.current !== -1 && Math.abs(currentY - lastRestoreYRef.current) > 10) {
        timerRef.current = null;
        return;
      }

      // Scroll to where we can (clamped to current page height)
      const clampedTarget = Math.min(targetY, Math.max(maxScroll, 0));
      lastRestoreYRef.current = clampedTarget;
      window.scrollTo(0, clampedTarget);

      // Retry again
      timerRef.current = setTimeout(tryRestore, 100);
    };

    tryRestore();
  }, [key, pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
