export type SocialIconKey = 'github' | 'linkedin' | 'instagram' | 'mail';

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  icon: SocialIconKey;
}
