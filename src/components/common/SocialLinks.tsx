import { Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons';
import { FaLinkedin } from 'react-icons/fa6';
import { SiGithub, SiInstagram } from 'react-icons/si';
import { socialLinks } from '@/data/social';
import type { SocialIconKey } from '@/types/social';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

const icons: Record<SocialIconKey, IconType | LucideIcon> = {
  github: SiGithub,
  linkedin: FaLinkedin,
  instagram: SiInstagram,
  mail: Mail,
};

export function SocialLinks() {
  return (
    <ul className="flex items-center gap-5">
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
              <Icon aria-hidden="true" size={22} />
              <VisuallyHidden>{social.label}</VisuallyHidden>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
