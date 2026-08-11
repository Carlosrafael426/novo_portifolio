import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Rola até a seção correspondente ao hash da URL sempre que ele mudar.
 * Permite navegar de qualquer rota de volta para uma âncora da Home (ex: vindo de /projects/:slug).
 */
export function useHashScroll(): void {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const element = document.getElementById(hash.replace('#', ''));
    element?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
}

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
