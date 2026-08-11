export type TechnologyCategory = 'frontend' | 'backend' | 'database' | 'infrastructure';
export type TechnologyLevel = 'principal' | 'apoio' | 'estudando';

export interface Technology {
  id: string;
  name: string;
  category: TechnologyCategory;
  level: TechnologyLevel;
}
