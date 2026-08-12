import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { Download, Grip, X } from 'lucide-react';
import logoLimpa from '@/assets/logo/logo-limpa.png';
import { navItems } from '@/data/nav';
import type { NavItem } from '@/types/nav';
import { useActiveSection } from '@/hooks/useActiveSection';
import { scrollToSection } from '@/hooks/useHashScroll';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const sectionIds = navItems.map((item) => item.sectionId);
const CV_PATH = '/cv-carlos-rafael.pdf';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const activeId = useActiveSection(sectionIds);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, item: NavItem) {
    if (isHome) {
      event.preventDefault();
      scrollToSection(item.sectionId);
    }
    closeMobileMenu();
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-(--z-navbar) border-b backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-4 md:grid md:grid-cols-3">
        <Link
          to={{ pathname: '/', hash: '#inicio' }}
          onClick={closeMobileMenu}
          aria-label="Carlos Rafael — início"
          className="shrink-0"
        >
          <img
            id="navbar-logo"
            src={logoLimpa}
            alt=""
            className="aspect-[1133/654] h-14 w-auto md:h-16"
          />
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:flex md:justify-center">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = isHome && activeId === item.sectionId;

              return (
                <li key={item.sectionId}>
                  <Link
                    to={{ pathname: '/', hash: item.href }}
                    onClick={(event) => handleNavClick(event, item)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'group text-muted hover:text-foreground relative inline-block px-1 py-1 font-mono text-xs tracking-[0.15em] uppercase transition-colors',
                      isActive && 'text-accent',
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="bg-accent absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-3">
          <Button href={CV_PATH} download variant="secondary" size="sm">
            <Download aria-hidden="true" size={14} />
            <span className="hidden sm:inline">Baixar CV</span>
          </Button>

          <button
            type="button"
            className="border-border text-foreground hover:border-accent hover:text-accent flex h-10 w-10 items-center justify-center rounded-full border transition-colors md:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" size={18} />
            ) : (
              <Grip aria-hidden="true" size={18} />
            )}
          </button>
        </div>
      </Container>

      {isMobileMenuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Navegação mobile"
          className="border-border bg-background border-t md:hidden"
        >
          <ul className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <li key={item.sectionId}>
                <Link
                  to={{ pathname: '/', hash: item.href }}
                  onClick={(event) => handleNavClick(event, item)}
                  className="text-muted hover:text-accent block px-2 py-3 font-mono text-sm tracking-widest uppercase"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
