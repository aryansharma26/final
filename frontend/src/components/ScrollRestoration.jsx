import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

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

/**
 * Ultra-smooth, jitter-free scroll restoration component.
 */
export default function ScrollRestoration() {
  const { key, pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(getStored());
  const prevKeyRef = useRef(null);
  const prevPathRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Disable native scroll restoration
  useEffect(() => {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Save scroll position on active user scroll
  const handleScroll = useCallback(() => {
    if (isNavigatingRef.current) return;

    const y = window.scrollY;
    positions.current[key] = y;
    positions.current[pathname + search] = y;
    positions.current[pathname] = y;
    setStored(positions.current);
  }, [key, pathname, search]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Synchronous restoration on route change
  useLayoutEffect(() => {
    // First mount — record initial key & path
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      prevPathRef.current = pathname;
      return;
    }

    if (prevKeyRef.current === key) return;

    prevKeyRef.current = key;
    prevPathRef.current = pathname;

    // PUSH / REPLACE — scroll to top
    if (navigationType === 'PUSH' || navigationType === 'REPLACE') {
      isNavigatingRef.current = true;
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
      return;
    }

    // POP (Back / Forward button)
    const saved = positions.current[key]
      ?? positions.current[pathname + search]
      ?? positions.current[pathname];

    if (saved !== undefined && saved > 0) {
      isNavigatingRef.current = true;
      window.scrollTo(0, saved);
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
        requestAnimationFrame(() => {
          isNavigatingRef.current = false;
        });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [key, pathname, search, navigationType]);

  return null;
}
