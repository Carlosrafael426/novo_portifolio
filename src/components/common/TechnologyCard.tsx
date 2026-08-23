import type { ComponentType } from 'react';
import { Webhook } from 'lucide-react';
import {
  SiCss,
  SiExpress,
  SiFigma,
  SiGit,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiNodedotjs,
  SiPostgresql,
  SiReact,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVite,
} from 'react-icons/si';
import type { Technology } from '@/types/technology';

/** Ícone de verdade de cada tecnologia (Simple Icons) — só "APIs REST" fica com um ícone
 *  genérico, já que não é uma marca com logo próprio. Exportado porque TechnologyGroup usa o
 *  mesmo formato pros ícones oficiais de categoria. */
export type IconComponent = ComponentType<{
  'aria-hidden'?: boolean | 'true' | 'false';
  size?: number;
  className?: string;
}>;

const icons: Record<string, IconComponent> = {
  react: SiReact,
  typescript: SiTypescript,
  javascript: SiJavascript,
  html: SiHtml5,
  css: SiCss,
  tailwind: SiTailwindcss,
  vite: SiVite,
  nodejs: SiNodedotjs,
  express: SiExpress,
  rest: Webhook,
  postgresql: SiPostgresql,
  git: SiGit,
  github: SiGithub,
  vercel: SiVercel,
  figma: SiFigma,
};

interface TechnologyCardProps {
  technology: Technology;
  /** Se o card-mãe já começou a aparecer — a barra só enche depois disso, nunca antes. */
  revealed: boolean;
  /** Quando essa linha específica deve começar a encher, em ms desde que "revealed" virou true. */
  fillDelayMs: number;
  reducedMotion: boolean;
}

export function TechnologyCard({ technology, revealed, fillDelayMs, reducedMotion }: TechnologyCardProps) {
  const Icon = icons[technology.id] ?? Webhook;
  const filled = reducedMotion || revealed;

  return (
    <li className="group text-muted hover:text-foreground flex items-center gap-3 py-2 text-sm transition-colors">
      <Icon
        aria-hidden="true"
        size={16}
        className="text-accent shrink-0 transition-transform duration-300 group-hover:scale-110"
      />
      <span className="text-foreground flex-1">{technology.name}</span>
      <span className="text-muted w-8 shrink-0 text-right font-mono text-[10px] tabular-nums">
        {technology.progress}%
      </span>
      <div
        aria-hidden="true"
        className="border-border h-1 w-14 shrink-0 overflow-hidden rounded-full border"
      >
        <div
          className="bg-accent h-full rounded-full"
          style={{
            width: filled ? `${technology.progress}%` : '0%',
            transition: reducedMotion ? 'none' : 'width 700ms ease-out',
            transitionDelay: reducedMotion ? '0ms' : `${fillDelayMs}ms`,
          }}
        />
      </div>
    </li>
  );
}
