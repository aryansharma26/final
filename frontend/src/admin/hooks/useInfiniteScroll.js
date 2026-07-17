import { useEffect, useRef } from 'react';

export const useInfiniteScroll = ({ enabled, loading, onLoadMore, rootMargin = '240px' }) => {
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !enabled || loading) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, loading, onLoadMore, rootMargin]);

  return loadMoreRef;
};
