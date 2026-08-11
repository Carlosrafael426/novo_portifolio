import { Briefcase, Code2, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { socialLinks } from '@/data/social';
import type { SocialIconKey } from '@/types/social';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

// lucide-react não inclui logos de marca (GitHub/LinkedIn) — ícones genéricos como substitutos.
const icons: Record<SocialIconKey, LucideIcon> = {
  github: Code2,
  linkedin: Briefcase,
  mail: Mail,
};

export function SocialLinks() {
  return (
    <ul className="flex items-center gap-4">
      {socialLinks.map((social) => {
        const Icon = icons[social.icon];

        return (
          <li key={social.id}>
            <a href={social.href} className="text-muted hover:text-accent transition-colors">
              <Icon aria-hidden="true" size={18} />
              <VisuallyHidden>{social.label}</VisuallyHidden>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
