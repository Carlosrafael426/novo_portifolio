import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function RootLayout() {
  const { pathname, hash } = useLocation();

  // React Router não reseta o scroll em navegações client-side. Sem hash (troca de rota "seca",
  // ex: Home -> /projects/:slug), volta pro topo; com hash, quem cuida é o useHashScroll da Home.
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:bg-accent focus:text-accent-foreground focus:absolute focus:top-2 focus:left-2 focus:z-(--z-skip-link) focus:rounded focus:px-4 focus:py-2"
      >
        Pular para o conteúdo principal
      </a>
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
