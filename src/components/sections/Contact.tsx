import { Hexagon, MessageCircle, Rocket, ShieldCheck, Zap } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Section } from '@/components/ui/Section';
import { ClippedPanel } from '@/components/ui/ClippedPanel';
import { whatsappUrl } from '@/data/social';

/** Traço decorativo tipo trilha de circuito, saindo da segunda linha do título — mesmo motivo
 *  visual usado no título da seção Stack. */
function TitleConnector() {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 24" className="text-accent/50 hidden h-6 min-w-20 flex-1 sm:block">
      <path d="M0 12H80L96 20H132" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="138" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

const trustPoints = [
  { icon: Rocket, label: '6 projetos no portfólio, incluindo clientes reais' },
  { icon: Zap, label: 'Resposta rápida, direto no WhatsApp' },
  { icon: ShieldCheck, label: 'Sem compromisso — é só uma conversa' },
];

export function Contact() {
  return (
    <Section
      id="contato"
      eyebrow="05 / Contato"
      title={
        <span className="block">
          <span className="block">Vamos tirar</span>
          <span className="flex flex-wrap items-center gap-4">
            <span>sua ideia</span>
            <TitleConnector />
          </span>
          <span className="text-accent block">do papel?</span>
        </span>
      }
    >
      <div className="max-w-2xl">
        <p className="text-muted text-base sm:text-lg">
          Trabalho com React, TypeScript e Node.js pra transformar ideias em produtos reais —
          sites institucionais, sistemas e aplicações sob medida, do primeiro protótipo até o ar.
          Se você tem um projeto em mente, um negócio que precisa de presença digital, ou só quer
          trocar uma ideia, me chama agora.
        </p>

        <ul className="mt-8 space-y-4">
          {trustPoints.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-4">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                <Hexagon
                  aria-hidden="true"
                  strokeWidth={1}
                  className="text-accent/70 animate-hex-spin motion-reduce:animate-none absolute inset-0 h-full w-full"
                />
                <Icon
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.5}
                  className="text-accent animate-system-pulse motion-reduce:animate-none relative"
                />
              </span>
              <span className="text-foreground text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <ClippedPanel
        corners="all"
        cut={28}
        wrapperClassName="mt-12"
        className="relative overflow-hidden p-8 text-center sm:p-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-6 right-8 h-16 w-16 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-border-strong) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />

        <div className="relative flex flex-col items-center">
          <span className="text-accent flex items-center gap-1.5 font-mono text-xs tracking-[0.2em] uppercase">
            <span className="bg-accent animate-system-pulse motion-reduce:animate-none size-1.5 rounded-full" />
            Disponível para novos projetos
          </span>

          <span className="relative mt-6 flex h-16 w-16 shrink-0 items-center justify-center">
            <Hexagon
              aria-hidden="true"
              strokeWidth={1}
              className="text-accent/70 animate-hex-spin motion-reduce:animate-none absolute inset-0 h-full w-full"
            />
            <MessageCircle
              aria-hidden="true"
              size={26}
              strokeWidth={1.5}
              className="text-accent animate-system-pulse motion-reduce:animate-none relative"
            />
          </span>

          <h3 className="font-display mt-5 text-2xl font-normal tracking-widest uppercase sm:text-3xl">
            Vamos conversar?
          </h3>
          <p className="text-muted mt-3 max-w-md text-sm sm:text-base">
            Clica no botão abaixo e me chama direto no WhatsApp — sem formulário, sem espera.
            Geralmente respondo em poucas horas.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-accent text-accent-foreground hover:bg-accent/85 mt-8 inline-flex items-center gap-3 rounded-md px-8 py-4 font-mono text-sm font-bold tracking-widest uppercase transition-colors"
          >
            <SiWhatsapp aria-hidden="true" size={18} />
            Chamar no WhatsApp
          </a>

          <p className="text-muted mt-4 font-mono text-xs tracking-wide">+55 41 99589-6092</p>
        </div>
      </ClippedPanel>
    </Section>
  );
}
