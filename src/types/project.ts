export interface ProjectCaseStudy {
  problem: string;
  solution: string;
  process: string;
  result: string;
  screenshots?: string[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  technologies: string[];
  image?: string;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  year: number;
  caseStudy?: ProjectCaseStudy;
}
