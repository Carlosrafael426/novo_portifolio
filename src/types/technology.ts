export type TechnologyCategory = 'frontend' | 'backend' | 'database' | 'infrastructure';

export interface Technology {
  id: string;
  name: string;
  category: TechnologyCategory;
  /** 0–100: o quanto eu domino essa tecnologia hoje, mostrado como barra de progresso. */
  progress: number;
}
