import { useEffect, useState } from 'react';

export function useParallax(speed = 0.1, clamp = 80) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches) {
      setOffset(0);
      return;
    }

    let frameId = 0;

    const updateOffset = () => {
      const nextOffset = Math.min(clamp, window.scrollY * speed);
      setOffset(nextOffset);
    };

    const onScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateOffset);
    };

    updateOffset();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [speed, clamp]);

  return offset;
}
