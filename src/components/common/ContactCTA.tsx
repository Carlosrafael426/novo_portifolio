import { Code2, Hexagon, MessageCircle, MonitorSmartphone, Rocket, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClippedPanel } from '@/components/ui/ClippedPanel';

interface Feature {
  icon: LucideIcon;
  label: string;
}

const features: Feature[] = [
  { icon: Rocket, label: 'Desenvolvimento web moderno e performático' },
  { icon: Code2, label: 'Soluções personalizadas para o seu negócio' },
  { icon: MonitorSmartphone, label: 'Design responsivo e experiência excepcional' },
  { icon: Zap, label: 'Entrega ágil, código limpo e escalável' },
];

export function ContactCTA() {
  return (
    <div>
      <p className="text-muted max-w-md">
        Se você gostou do meu estilo e acredita que podemos criar algo incrível juntos, estou
        pronto para transformar sua ideia em realidade.
      </p>

      <ul className="mt-8 space-y-5">
        {features.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-4">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <Hexagon aria-hidden="true" strokeWidth={1} className="text-accent/70 absolute inset-0 h-full w-full" />
              <Icon aria-hidden="true" size={16} strokeWidth={1.5} className="text-accent relative" />
            </span>
            <span className="text-foreground text-sm">{label}</span>
            <span aria-hidden="true" className="border-border-strong ml-1 h-px flex-1 border-t border-dotted" />
          </li>
        ))}
      </ul>

      <ClippedPanel corners="opposite" cut={24} wrapperClassName="mt-10" className="relative overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-6 h-14 w-14 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-border-strong) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
        <div className="relative flex items-start gap-4">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <Hexagon aria-hidden="true" strokeWidth={1} className="text-accent/70 absolute inset-0 h-full w-full" />
            <MessageCircle aria-hidden="true" size={20} strokeWidth={1.5} className="text-accent relative" />
          </span>
          <div>
            <p className="text-accent font-display text-sm font-normal tracking-widest uppercase">
              Vamos conversar?
            </p>
            <p className="text-muted mt-1 text-sm">
              Estou sempre aberto a novas oportunidades, parcerias e projetos desafiadores.
            </p>
          </div>
        </div>
      </ClippedPanel>
    </div>
  );
}
