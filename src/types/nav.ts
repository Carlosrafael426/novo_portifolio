export interface NavItem {
  label: string;
  sectionId: string;
  /** Sempre um hash ('#id') — a Home é a seção 'hero', não uma rota separada. */
  href: string;
}
