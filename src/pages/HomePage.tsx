import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useHashScroll } from '@/hooks/useHashScroll';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Stack } from '@/components/sections/Stack';
import { Projects } from '@/components/sections/Projects';
import { Engine } from '@/components/sections/Engine';
import { Trajetoria } from '@/components/sections/Trajetoria';
import { Contact } from '@/components/sections/Contact';

export default function HomePage() {
  useDocumentTitle(
    'Carlos Rafael — Desenvolvedor Full Stack',
    'Projetos, stack técnica e trajetória em desenvolvimento web.',
  );
  useHashScroll();

  return (
    <>
      <Hero />
      <About />
      <Stack />
      <Projects />
      <Engine />
      <Trajetoria />
      <Contact />
    </>
  );
}
