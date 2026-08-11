import type { Project } from '@/types/project';

export const projects: Project[] = [
  {
    id: 'marcia-porto-cakes',
    slug: 'marcia-porto-cakes',
    title: 'Márcia Porto Cakes',
    subtitle: 'Site para uma confeitaria artesanal',
    description:
      'Site institucional para uma confeitaria artesanal. Meu primeiro projeto entregue para uma cliente de verdade, hoje no ar.',
    category: 'Cliente real',
    technologies: ['React', 'Tailwind CSS', 'TypeScript'],
    featured: true,
    year: 2026,
    // TODO: preencher
    liveUrl: undefined,
    // TODO: preencher
    githubUrl: undefined,
    // TODO: preencher
    image: undefined,
    caseStudy: {
      problem: '[Placeholder] Qual problema este projeto resolve.',
      solution: '[Placeholder] Como o problema foi resolvido.',
      process: '[Placeholder] Etapas e processo de desenvolvimento.',
      result: '[Placeholder] Resultado ou impacto alcançado.',
    },
  },
  {
    id: 'finance-mate',
    slug: 'finance-mate',
    title: 'Finance Mate',
    subtitle: 'Controle financeiro pessoal com login',
    description:
      'Sistema de finanças pessoais com autenticação de usuário e dados persistidos em banco. Meu primeiro projeto de ponta a ponta.',
    category: 'Full Stack',
    technologies: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    featured: true,
    year: 2026,
    // TODO: preencher
    liveUrl: undefined,
    // TODO: preencher
    githubUrl: undefined,
    // TODO: preencher
    image: undefined,
    caseStudy: {
      problem: '[Placeholder] Qual problema este projeto resolve.',
      solution: '[Placeholder] Como o problema foi resolvido.',
      process: '[Placeholder] Etapas e processo de desenvolvimento.',
      result: '[Placeholder] Resultado ou impacto alcançado.',
    },
  },
  {
    id: 'pokedex',
    slug: 'pokedex',
    title: 'Pokédex Interativa',
    subtitle: 'Consumo da PokeAPI com busca e detalhes',
    description:
      'Pokédex consumindo a PokeAPI, com busca, listagem e tela de detalhes de cada Pokémon.',
    category: 'Web App',
    technologies: ['React', 'TypeScript', 'APIs REST'],
    featured: true,
    year: 2026,
    // TODO: preencher
    liveUrl: undefined,
    // TODO: preencher
    githubUrl: undefined,
    // TODO: preencher
    image: undefined,
  },
  {
    id: 'task-mate',
    slug: 'task-mate',
    title: 'Task Mate',
    subtitle: 'Gerenciador de tarefas com persistência',
    description:
      'Gerenciador de tarefas com criação, edição, conclusão e persistência entre sessões.',
    category: 'Web App',
    technologies: ['React', 'TypeScript'],
    featured: false,
    year: 2026,
    // TODO: preencher
    liveUrl: undefined,
    // TODO: preencher
    githubUrl: undefined,
    // TODO: preencher
    image: undefined,
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
    featured: false,
    year: 2026,
    // TODO: preencher
    liveUrl: undefined,
    // TODO: preencher
    githubUrl: undefined,
    // TODO: preencher
    image: undefined,
  },
  {
    id: 'pong',
    slug: 'pong',
    title: 'Pong',
    subtitle: 'Recriação do Pong com placar e colisão',
    description:
      'Recriação do Pong, com controle de raquete, detecção de colisão e placar, em JavaScript puro.',
    category: 'Jogo',
    technologies: ['JavaScript', 'HTML5 Canvas', 'CSS3'],
    featured: false,
    year: 2026,
    // TODO: preencher
    liveUrl: undefined,
    // TODO: preencher
    githubUrl: undefined,
    // TODO: preencher
    image: undefined,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
