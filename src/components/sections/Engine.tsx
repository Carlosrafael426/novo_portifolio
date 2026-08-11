import { Fragment } from 'react';
import { ArrowRight, Database, Hexagon, Monitor, Server, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { engineLayers } from '@/data/engine';

const icons: Record<string, LucideIcon> = {
  user: User,
  frontend: Monitor,
  api: Hexagon,
  backend: Server,
  database: Database,
};

export function Engine() {
  return (
    <Section id="arquitetura" eyebrow="05 / Arquitetura" title="Como eu monto">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <ol className="flex flex-1 flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          {engineLayers.map((layer, index) => {
            const Icon = icons[layer.id] ?? Hexagon;

            return (
              <Fragment key={layer.id}>
                <li className="border-border bg-card flex min-w-40 flex-col items-center gap-2 rounded-lg border px-5 py-4 text-center">
                  <Icon aria-hidden="true" size={20} className="text-accent" />
                  <p className="font-mono text-xs tracking-wide uppercase">{layer.label}</p>
                </li>
                {index < engineLayers.length - 1 ? (
                  <ArrowRight aria-hidden="true" className="text-border-strong hidden shrink-0 sm:block" />
                ) : null}
              </Fragment>
            );
          })}
        </ol>

        <div className="border-border bg-card w-full max-w-xs shrink-0 rounded-lg border p-5">
          <p className="text-muted font-mono text-[10px] tracking-[0.2em] uppercase">
            Sistema.status
          </p>
          <p className="text-accent mt-2 flex items-center gap-2 font-mono text-sm">
            <span className="bg-accent h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            Online
          </p>
          <svg viewBox="0 0 200 40" className="text-accent/60 mt-4 h-10 w-full" aria-hidden="true">
            <polyline
              points="0,30 20,25 40,28 60,15 80,20 100,10 120,18 140,8 160,14 180,6 200,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </Section>
  );
}
