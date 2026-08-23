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
import type { Technology, TechnologyLevel } from '@/types/technology';

/** Ícone de verdade de cada tecnologia (Simple Icons) — só "APIs REST" fica com um ícone
 *  genérico, já que não é uma marca com logo próprio. */
type IconComponent = ComponentType<{
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

const levelLabels: Record<TechnologyLevel, string> = {
  principal: 'Uso sempre',
  apoio: 'Uso quando precisa',
  estudando: 'Estudando',
};

interface TechnologyCardProps {
  technology: Technology;
}

export function TechnologyCard({ technology }: TechnologyCardProps) {
  const Icon = icons[technology.id] ?? Webhook;

  return (
    <li className="group text-muted hover:text-foreground flex items-center gap-3 py-2 text-sm transition-colors">
      <Icon
        aria-hidden="true"
        size={16}
        className="text-accent shrink-0 transition-transform duration-300 group-hover:scale-110"
      />
      <span className="text-foreground flex-1">{technology.name}</span>
      <span className="text-muted font-mono text-[10px] tracking-wide uppercase">
        {levelLabels[technology.level]}
      </span>
    </li>
  );
}
