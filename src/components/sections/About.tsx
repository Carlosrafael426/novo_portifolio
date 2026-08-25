import { useState } from 'react';
import { Section } from '@/components/ui/Section';
import { FaceGraphicSlot } from '@/components/common/FaceGraphicSlot';

export function About() {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <Section
      id="sobre"
      // Some enquanto o texto está aberto — pelo mesmo motivo do título logo abaixo: o painel
      // revelado não tem fundo opaco, então esse label bem no topo da seção vazaria por trás dele.
      eyebrow={isRevealed ? undefined : '02 / Identidade'}
      title={<span className="sr-only">Quem sou eu</span>}
      className="min-h-screen"
      background={<FaceGraphicSlot className="absolute inset-0" onDissolvedChange={setIsRevealed} />}
    >
      {/* Some enquanto o texto (bem maior, em duas colunas) está aberto — o painel não tem fundo
          opaco de propósito (os estilhaços do rosto continuam à deriva atrás dele), então sem isso
          esse título estático vazaria por trás das colunas de texto. */}
      <p
        aria-hidden="true"
        className={`font-display text-center text-2xl leading-none font-normal whitespace-nowrap uppercase transition-opacity duration-300 sm:text-3xl ${isRevealed ? 'opacity-0' : 'opacity-100'}`}
      >
        Quem sou{' '}
        <span className="text-accent">
          eu<span className="animate-cursor-blink">_</span>
        </span>
      </p>
    </Section>
  );
}
