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
 * Smooth scroll restoration with animated transition.
 * Fixes: footer flash, old-position jumps, and scroll position overwriting on repeated navigation.
 */
export default function ScrollRestoration() {
  const { key, pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(getStored());
  const prevKeyRef = useRef(null);
  const prevPathRef = useRef(null);
  const scrollYRef = useRef(0);
  const isRestoringRef = useRef(false);
  const rafIdRef = useRef(null);

  // Disable native scroll restoration
  useEffect(() => {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Save scroll position on user scroll
  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    // ALWAYS keep scrollYRef in sync with actual scroll position
    scrollYRef.current = y;

    if (isRestoringRef.current) return;

    positions.current[key] = y;
    positions.current[pathname + search] = y;
    positions.current[pathname] = y;
    setStored(positions.current);

    console.log('[ScrollRestoration] SAVE (scroll)', {
      key,
      pathname,
      scrollY: y,
      scrollYRef: scrollYRef.current,
      prevKey: prevKeyRef.current,
      prevPath: prevPathRef.current,
      positions: { ...positions.current },
    });
  }, [key, pathname, search]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Core restoration logic — runs synchronously before paint
  useLayoutEffect(() => {
    // First mount — just record refs
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      prevPathRef.current = pathname;
      return;
    }

    // Same key — no navigation happened
    if (prevKeyRef.current === key) return;

    // Save position of page we're LEAVING using current scrollYRef
    if (prevPathRef.current) {
      positions.current[prevPathRef.current] = scrollYRef.current;
    }
    if (prevKeyRef.current) {
      positions.current[prevKeyRef.current] = scrollYRef.current;
    }
    setStored(positions.current);

    console.log('[ScrollRestoration] SAVE (page leave)', {
      leavingKey: prevKeyRef.current,
      leavingPath: prevPathRef.current,
      savedScrollY: scrollYRef.current,
      currentKey: key,
      currentPathname: pathname,
      positions: { ...positions.current },
    });

    prevKeyRef.current = key;
    prevPathRef.current = pathname;

    // Cancel any in-flight restoration from previous navigation
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // PUSH / REPLACE — always scroll to top instantly
    if (navigationType === 'PUSH' || navigationType === 'REPLACE') {
      isRestoringRef.current = false;
      document.body.style.minHeight = '';
      window.scrollTo(0, 0);
      scrollYRef.current = 0;

      console.log('[ScrollRestoration] RESET TO TOP (PUSH/REPLACE)', {
        key,
        pathname,
        navigationType,
        scrollYRef: scrollYRef.current,
        prevKey: prevKeyRef.current,
        prevPath: prevPathRef.current,
        positions: { ...positions.current },
      });
      return;
    }

    // POP (back/forward) — restore saved position
    const saved = positions.current[key]
      ?? positions.current[pathname + search]
      ?? positions.current[pathname];

    if (saved === undefined || saved <= 0) {
      isRestoringRef.current = false;
      document.body.style.minHeight = '';
      window.scrollTo(0, 0);
      scrollYRef.current = 0;

      console.log('[ScrollRestoration] RESTORE (no saved position -> top)', {
        key,
        pathname,
        navigationType,
        scrollYRef: scrollYRef.current,
        prevKey: prevKeyRef.current,
        prevPath: prevPathRef.current,
        positions: { ...positions.current },
      });
      return;
    }

    // Lock body to prevent layout collapse while content loads
    isRestoringRef.current = true;
    const targetY = saved;
    scrollYRef.current = targetY;
    document.body.style.minHeight = `${targetY + window.innerHeight}px`;

    console.log('[ScrollRestoration] RESTORE (target found)', {
      key,
      pathname,
      navigationType,
      targetY,
      scrollYRef: scrollYRef.current,
      prevKey: prevKeyRef.current,
      prevPath: prevPathRef.current,
      positions: { ...positions.current },
    });

    // Immediately jump to target
    window.scrollTo(0, targetY);

    // Poll until real content is tall enough, then settle
    let attempts = 0;
    const maxAttempts = 30; // ~500ms at 16ms/frame

    const pollAndSettle = () => {
      attempts++;
      const docHeight = document.documentElement.scrollHeight;
      const contentReady = docHeight >= targetY + window.innerHeight * 0.95;

      if (contentReady || attempts >= maxAttempts) {
        window.scrollTo(0, targetY);
        scrollYRef.current = targetY;

        rafIdRef.current = requestAnimationFrame(() => {
          document.body.style.minHeight = '';
          requestAnimationFrame(() => {
            window.scrollTo(0, targetY);
            scrollYRef.current = targetY;
            isRestoringRef.current = false;
          });
        });
        return;
      }

      window.scrollTo(0, targetY);
      scrollYRef.current = targetY;
      rafIdRef.current = requestAnimationFrame(pollAndSettle);
    };

    rafIdRef.current = requestAnimationFrame(pollAndSettle);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [key, pathname, search, navigationType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.minHeight = '';
      isRestoringRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return null;
}
