import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);

  useEffect(() => {
    let intersectionObserver: IntersectionObserver | null = null;

    function handleIntersect(entries: IntersectionObserverEntry[]) {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (mostVisible) {
        setActiveId(mostVisible.target.id);
      }
    }

    function trySetup(): boolean {
      const elements = sectionIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null);

      if (elements.length === 0) return false;

      intersectionObserver = new IntersectionObserver(handleIntersect, {
        rootMargin: '-40% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      });

      elements.forEach((element) => intersectionObserver?.observe(element));
      return true;
    }

    if (trySetup()) {
      return () => intersectionObserver?.disconnect();
    }

    // As seções ainda não existem no DOM (ex: rota lazy-loaded ainda carregando) —
    // observa o body até elas aparecerem, então liga o IntersectionObserver de verdade.
    const mutationObserver = new MutationObserver(() => {
      if (trySetup()) {
        mutationObserver.disconnect();
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [sectionIds]);

  return activeId;
}
