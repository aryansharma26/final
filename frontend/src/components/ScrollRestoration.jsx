import { useEffect, useLayoutEffect, useRef } from 'react';
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

export default function ScrollRestoration() {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(getStored());
  const prevKeyRef = useRef(null);
  const prevPathRef = useRef(null);
  const scrollYRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // Disable native scroll restoration
  useEffect(() => {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Save position on scroll (ignore restoration-induced scroll events)
  useEffect(() => {
    const handleScroll = () => {
      if (isTransitioningRef.current) return;
      const y = window.scrollY;
      scrollYRef.current = y;
      positions.current[key] = y;
      setStored(positions.current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);

  // Synchronously flag route change and apply target minHeight during render to prevent scroll collapse
  if (prevKeyRef.current !== key) {
    isTransitioningRef.current = true;
    const targetY = positions.current[key] ?? positions.current[pathname];
    if (targetY !== undefined && targetY > 0 && navigationType === 'POP') {
      document.body.style.minHeight = `${targetY + window.innerHeight}px`;
      document.body.classList.add('js-scroll-restoring');
    }
  }

  // Restore scroll position on route change before painting
  useLayoutEffect(() => {
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      prevPathRef.current = pathname;
      isTransitioningRef.current = false;
      return;
    }

    if (prevKeyRef.current === key) {
      isTransitioningRef.current = false;
      return;
    }

    // Save the position of the page we're LEAVING (by pathname)
    positions.current[prevPathRef.current] = scrollYRef.current;
    setStored(positions.current);

    prevKeyRef.current = key;
    prevPathRef.current = pathname;

    // For new navigations (PUSH or REPLACE), we always open at the top of the page
    if (navigationType === 'PUSH' || navigationType === 'REPLACE') {
      document.body.style.minHeight = '';
      document.body.classList.remove('js-scroll-restoring');
      window.scrollTo(0, 0);
      isTransitioningRef.current = false;
      return;
    }

    const saved = positions.current[key] ?? positions.current[pathname];

    if (saved === undefined || saved <= 0) {
      document.body.style.minHeight = '';
      document.body.classList.remove('js-scroll-restoring');
      window.scrollTo(0, 0);
      isTransitioningRef.current = false;
      return;
    }

    // Apply temporary min-height to prevent scroll collapse and layout jumps
    const targetY = saved;
    document.body.style.minHeight = `${targetY + window.innerHeight}px`;
    window.scrollTo(0, targetY);

    // Clear the min-height in the next frame after browser has painted and restored scroll
    requestAnimationFrame(() => {
      document.body.style.minHeight = '';
      document.body.classList.remove('js-scroll-restoring');
      isTransitioningRef.current = false;
    });
  }, [key, pathname, navigationType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.minHeight = '';
      document.body.classList.remove('js-scroll-restoring');
    };
  }, []);

  return null;
}
