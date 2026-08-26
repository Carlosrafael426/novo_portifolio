import { Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons';
import { FaLinkedin } from 'react-icons/fa6';
import { SiGithub, SiInstagram, SiWhatsapp } from 'react-icons/si';
import { socialLinks } from '@/data/social';
import type { SocialIconKey } from '@/types/social';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cn } from '@/utils/cn';

const icons: Record<SocialIconKey, IconType | LucideIcon> = {
  github: SiGithub,
  linkedin: FaLinkedin,
  instagram: SiInstagram,
  whatsapp: SiWhatsapp,
  mail: Mail,
};

interface SocialLinksProps {
  size?: number;
  className?: string;
}

export function SocialLinks({ size = 22, className }: SocialLinksProps) {
  return (
    <ul className={cn('flex items-center gap-5', className)}>
      {socialLinks.map((social) => {
        const Icon = icons[social.icon];
        const isExternal = social.href.startsWith('http');

        return (
          <li key={social.id}>
            <a
              href={social.href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noreferrer' : undefined}
              className="text-muted hover:text-accent transition-colors"
            >
              <Icon aria-hidden="true" size={size} />
              <VisuallyHidden>{social.label}</VisuallyHidden>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
