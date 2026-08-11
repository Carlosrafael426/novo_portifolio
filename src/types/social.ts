export type SocialIconKey = 'github' | 'linkedin' | 'mail';

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  icon: SocialIconKey;
}
