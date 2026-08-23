import { useEffect, useRef, useState } from 'react';

/**
 * true assim que o elemento entra na viewport, uma única vez — pra revelações de scroll, não
 * pra esconder o elemento de novo ao rolar pra longe.
 */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
