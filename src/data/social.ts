import type { SocialLink } from '@/types/social';

/** Reaproveitado pelos botões "Vamos conversar" (Hero, Projetos) — mesmo link, uma fonte só. */
export const whatsappUrl = 'https://wa.me/5541995896092';

export const socialLinks: SocialLink[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/Carlosrafael426', icon: 'github' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/carlos-rafael-dev/', icon: 'linkedin' },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/carlos_rafael426/',
    icon: 'instagram',
  },
  { id: 'whatsapp', label: 'WhatsApp', href: whatsappUrl, icon: 'whatsapp' },
  { id: 'mail', label: 'E-mail', href: 'mailto:carlosrafael360@gmail.com', icon: 'mail' },
];
