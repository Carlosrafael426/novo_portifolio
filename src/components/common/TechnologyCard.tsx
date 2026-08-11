import {
  Atom,
  Braces,
  Code2,
  Database,
  FileCode,
  FileCode2,
  FolderGit2,
  GitBranch,
  Hexagon,
  Palette,
  PenTool,
  Rocket,
  Server,
  Webhook,
  Wind,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Technology, TechnologyLevel } from '@/types/technology';

const icons: Record<string, LucideIcon> = {
  react: Atom,
  typescript: FileCode,
  javascript: Braces,
  html: FileCode2,
  css: Palette,
  tailwind: Wind,
  vite: Zap,
  nodejs: Hexagon,
  express: Server,
  rest: Webhook,
  postgresql: Database,
  git: GitBranch,
  github: FolderGit2,
  vercel: Rocket,
  figma: PenTool,
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
  const Icon = icons[technology.id] ?? Code2;

  return (
    <li className="border-border text-muted hover:border-accent hover:text-foreground flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors">
      <Icon aria-hidden="true" size={16} className="text-accent shrink-0" />
      <span className="flex-1">{technology.name}</span>
      <span className="text-muted font-mono text-[10px] tracking-wide uppercase">
        {levelLabels[technology.level]}
      </span>
    </li>
  );
}
