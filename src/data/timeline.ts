import type { TimelineEntry } from '@/types/timeline';

// TODO: confirmar datas
export const timeline: TimelineEntry[] = [
  {
    id: 'devclub',
    period: 'Nov / 2025',
    title: 'Início da formação Full Stack — DevClub',
    description:
      'Primeiro contato estruturado com desenvolvimento web: HTML, CSS e JavaScript do zero.',
    technologies: ['HTML5', 'CSS3', 'JavaScript'],
  },
  {
    id: 'primeiros-jogos',
    period: '2026',
    title: 'Primeiros projetos em JavaScript puro',
    description:
      'Pong e Freeway, construídos sem framework para entender lógica, canvas e manipulação de DOM na raiz.',
    technologies: ['JavaScript', 'HTML5 Canvas'],
  },
  {
    id: 'react',
    period: '2026',
    title: 'Migração para React',
    description:
      'Task Mate e Pokédex Interativa — componentização, estado e consumo de API na prática.',
    technologies: ['React', 'TypeScript'],
  },
  {
    id: 'fullstack',
    period: '2026',
    title: 'Finance Mate — primeiro projeto de ponta a ponta',
    description:
      'Saí do front puro: autenticação, back-end em Node com Express e dados em PostgreSQL.',
    technologies: ['React', 'Node.js', 'Express', 'PostgreSQL'],
  },
  {
    id: 'primeiro-cliente',
    period: '2026',
    title: 'Márcia Porto Cakes — primeiro cliente real',
    description:
      'Primeiro projeto com cliente de verdade: levantar requisito, entregar no prazo e colocar no ar.',
    technologies: ['React', 'Tailwind CSS', 'TypeScript'],
    highlight: true,
  },
  {
    id: 'atual',
    period: 'Atual',
    title: 'Concluindo a formação e buscando a primeira vaga',
    description:
      'Finalizando o DevClub, refinando o portfólio e procurando minha primeira oportunidade como desenvolvedor front-end.',
  },
];
