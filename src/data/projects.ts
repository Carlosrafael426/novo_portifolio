import type { Project } from '@/types/project';

export const projects: Project[] = [
  {
    id: 'missao-santa-faustina',
    slug: 'missao-santa-faustina',
    title: 'Missão Santa Faustina',
    subtitle: 'Site institucional de uma missão católica',
    description:
      'Site institucional da Missão Santa Faustina, em Fazenda Rio Grande (PR), com informações sobre a missão e suas atividades.',
    category: 'Cliente real',
    technologies: ['React', 'TypeScript', 'Tailwind CSS'],
    liveUrl: 'https://carlosrafael426.github.io/missao-santa-faustina/',
    githubUrl: 'https://github.com/Carlosrafael426/missao-santa-faustina',
    featured: true,
    year: 2026,
    caseStudy: {
      problem: '[Placeholder] Qual problema este projeto resolve.',
      solution: '[Placeholder] Como o problema foi resolvido.',
      process: '[Placeholder] Etapas e processo de desenvolvimento.',
      result: '[Placeholder] Resultado ou impacto alcançado.',
    },
  },
  {
    id: 'shinra',
    slug: 'shinra',
    title: 'Shinra',
    subtitle: 'Site institucional de uma software house',
    description:
      'Plataforma institucional e comercial para uma agência de software especializada em microsserviços, SaaS escalável e aplicativos mobile, com terminal interativo e calculadora de orçamento.',
    category: 'Landing page',
    technologies: ['React', 'TypeScript', 'Tailwind CSS'],
    githubUrl: 'https://github.com/Carlosrafael426/shinra',
    featured: true,
    year: 2026,
    caseStudy: {
      problem: '[Placeholder] Qual problema este projeto resolve.',
      solution: '[Placeholder] Como o problema foi resolvido.',
      process: '[Placeholder] Etapas e processo de desenvolvimento.',
      result: '[Placeholder] Resultado ou impacto alcançado.',
    },
  },
  {
    id: 'historias-para-a-vida',
    slug: 'historias-para-a-vida',
    title: 'Histórias para a Vida',
    subtitle: 'Site para uma autora, com catálogo de livros',
    description:
      'Site para uma autora, com catálogo de livros, página de lançamentos e seção sobre a autora.',
    category: 'Cliente real',
    technologies: ['React', 'TypeScript', 'Tailwind CSS'],
    liveUrl: 'https://carlosrafael426.github.io/historias-para-a-vida/',
    githubUrl: 'https://github.com/Carlosrafael426/historias-para-a-vida',
    featured: true,
    year: 2026,
    caseStudy: {
      problem: '[Placeholder] Qual problema este projeto resolve.',
      solution: '[Placeholder] Como o problema foi resolvido.',
      process: '[Placeholder] Etapas e processo de desenvolvimento.',
      result: '[Placeholder] Resultado ou impacto alcançado.',
    },
  },
  {
    id: 'devclub-concurso',
    slug: 'devclub-concurso',
    title: 'DevClub',
    subtitle: 'Landing page para uma comunidade de devs',
    description:
      'Landing page com seções de mentores, empresas parceiras e depoimentos, com scroll suave e animações.',
    category: 'Landing page',
    technologies: ['React', 'TypeScript', 'GSAP'],
    liveUrl: 'https://carlosrafael426.github.io/devclub-concurso/',
    githubUrl: 'https://github.com/Carlosrafael426/devclub-concurso',
    featured: false,
    year: 2026,
  },
  {
    id: 'pong',
    slug: 'pong',
    title: 'Pong',
    subtitle: 'Recriação do Pong com placar e colisão',
    description:
      'Recriação do Pong, com controle de raquete, detecção de colisão, IA simples e placar, em JavaScript puro.',
    category: 'Jogo',
    technologies: ['JavaScript', 'HTML5 Canvas', 'CSS3'],
    githubUrl: 'https://github.com/Carlosrafael426/Pong',
    featured: false,
    year: 2026,
  },
  {
    id: 'freeway',
    slug: 'freeway',
    title: 'Freeway',
    subtitle: 'Recriação do clássico do Atari',
    description:
      'Recriação do clássico do Atari: atravessar a via desviando do trânsito, feita em JavaScript puro.',
    category: 'Jogo',
    technologies: ['JavaScript', 'HTML5 Canvas', 'CSS3'],
    liveUrl: 'https://freeway-game-six.vercel.app',
    githubUrl: 'https://github.com/Carlosrafael426/freeway-game',
    featured: false,
    year: 2026,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
