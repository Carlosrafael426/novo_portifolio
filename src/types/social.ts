export type SocialIconKey = 'github' | 'linkedin' | 'instagram' | 'whatsapp' | 'mail';

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  icon: SocialIconKey;
}
