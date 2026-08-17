import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { PageLoader } from '@/components/ui/PageLoader';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        { index: true, element: withSuspense(<HomePage />) },
        { path: 'projects/:slug', element: withSuspense(<ProjectDetailPage />) },
        { path: '*', element: withSuspense(<NotFoundPage />) },
      ],
    },
  ],
  // Acompanha o `base` do Vite: '/' em dev, '/novo_portifolio/' no GitHub Pages.
  { basename: import.meta.env.BASE_URL },
);
