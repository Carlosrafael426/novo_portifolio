import type { Project } from '@/types/project';
import missaoSantaFaustinaImg from '@/assets/projects/missao-santa-faustina.jpg';
import shinraImg from '@/assets/projects/shinra.jpg';
import historiasParaAVidaImg from '@/assets/projects/historias-para-a-vida.jpg';
import devclubConcursoImg from '@/assets/projects/devclub-concurso.jpg';
import pongImg from '@/assets/projects/pong.jpg';
import freewayImg from '@/assets/projects/freeway.jpg';

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
    image: missaoSantaFaustinaImg,
    liveUrl: 'https://carlosrafael426.github.io/missao-santa-faustina/',
    githubUrl: 'https://github.com/Carlosrafael426/missao-santa-faustina',
    featured: true,
    year: 2026,
    caseStudy: {
      problem:
        'A missão não tinha presença digital própria: informações sobre a comunidade, a devoção à Divina Misericórdia, a vida de Santa Faustina e a agenda de atividades ficavam espalhadas ou dependiam de boca a boca.',
      solution:
        'Site institucional multi-página — início, nossa missão, Santa Faustina, Divina Misericórdia, comunidade, calendário de atividades e contato — com tema claro/escuro e navegação mobile-first, pra centralizar tudo num só lugar confiável.',
      process:
        'React 19, TypeScript e Tailwind CSS v4, com React Router pras páginas internas. Levantei o conteúdo junto à missão e usei imagens de domínio público como provisórias, já sinalizadas no próprio repositório pra troca por material próprio da comunidade.',
      result:
        'Site publicado e no ar, servindo como ponto de contato oficial da missão na web.',
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
    image: shinraImg,
    githubUrl: 'https://github.com/Carlosrafael426/shinra',
    featured: true,
    year: 2026,
    caseStudy: {
      problem:
        'Queria uma peça de portfólio que não fosse só "mais uma landing page de agência" — algo que mostrasse competência técnica de verdade e pensamento de produto, não só uma lista de serviços genérica.',
      solution:
        'Landing page com um hero de terminal interativo (simula em tempo real logs de deploy, telemetria de cluster e benchmarks de latência) e uma calculadora de escopo/orçamento: o visitante configura tipo de plataforma, escala de usuários e integrações de IA, e recebe na hora prazo estimado, complexidade e um link pronto pra enviar por WhatsApp.',
      process:
        'React 19, TypeScript, Vite e Tailwind CSS v4, com Lucide pros ícones e Canvas Confetti pra microinteração de conversão. Estruturei o showcase de serviços (SaaS multi-tenant, agentes de IA/RAG, apps mobile, microsserviços, modernização cloud) e cases fictícios pra ilustrar o formato de apresentação.',
      result:
        'Projeto no ar, funcionando como demonstração de que consigo ir além de HTML/CSS bonito: simulação de sistema real, calculadora interativa com lógica de negócio e um funil de conversão pensado de ponta a ponta.',
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
    image: historiasParaAVidaImg,
    liveUrl: 'https://carlosrafael426.github.io/historias-para-a-vida/',
    githubUrl: 'https://github.com/Carlosrafael426/historias-para-a-vida',
    featured: true,
    year: 2026,
    caseStudy: {
      problem:
        'Uma autora precisava de um site próprio pra reunir seu catálogo de livros, lançamentos e apresentação pessoal — hoje espalhado entre redes sociais, sem um lugar único e profissional pra direcionar leitores.',
      solution:
        'Site com catálogo de livros (listagem e página de detalhe por livro), seção de próximos lançamentos, página "sobre a autora" e transições de página animadas, dando a sensação de um site fluido e bem cuidado.',
      process:
        'React 19, TypeScript, Tailwind CSS v4 e React Router, com as páginas internas (Livros, Lançamentos, Sobre mim) carregadas sob demanda via lazy loading — só baixa o código de cada página quando o visitante navega até ela. Framer Motion cuida das transições entre rotas.',
      result:
        'Site publicado e no ar, funcionando como vitrine oficial da autora pro catálogo dela.',
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
    image: devclubConcursoImg,
    liveUrl: 'https://carlosrafael426.github.io/devclub-concurso/',
    githubUrl: 'https://github.com/Carlosrafael426/devclub-concurso',
    featured: false,
    year: 2026,
    caseStudy: {
      problem:
        'Uma landing page de comunidade/curso precisa convencer em segundos — apresentar a proposta, provar que funciona (depoimentos, empresas parceiras, mentores) e levar o visitante até o CTA sem parecer só mais uma página de vendas.',
      solution:
        'Landing page com sequência de abertura, fundo de rede neural animado, seções de stack ensinada, depoimentos, mentores, empresas parceiras e uma chamada final — construída com scroll suave em vez do scroll nativo do navegador.',
      process:
        'React 19 e TypeScript, GSAP pras animações de entrada e Lenis pro smooth scroll — mas o smooth scroll só é inicializado quando o visitante não pediu `prefers-reduced-motion`; nesse caso o scroll nativo (já acessível) é mantido, sem sacrificar quem prefere menos movimento na tela.',
      result: 'Landing page publicada e no ar, pronta pra campanha da comunidade.',
    },
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
    image: pongImg,
    githubUrl: 'https://github.com/Carlosrafael426/Pong',
    featured: false,
    year: 2026,
    caseStudy: {
      problem:
        'Exercício clássico de fundamentos: construir um jogo do zero, sem framework nenhum, praticando física de movimento, detecção de colisão e lógica de IA num ambiente onde não tem biblioteca pra esconder a complexidade.',
      solution:
        'Clone do Pong com raquete controlada por teclado (setas ou WASD) ou toque em telas móveis, oponente com IA simples, três níveis de dificuldade, placar e efeitos sonoros retrô.',
      process:
        'HTML5 Canvas pra renderizar o campo, JavaScript puro pra física da bola, inputs e IA do oponente, e a Web Audio API pra gerar os sons do jogo sem depender de arquivos de áudio externos.',
      result:
        'Jogo funcional publicado no GitHub, jogável tanto no desktop quanto no celular.',
    },
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
    image: freewayImg,
    liveUrl: 'https://freeway-game-six.vercel.app',
    githubUrl: 'https://github.com/Carlosrafael426/freeway-game',
    featured: false,
    year: 2026,
    caseStudy: {
      problem:
        'Praticar movimento contínuo, spawns de obstáculos e detecção de colisão em tempo real — a base de qualquer jogo de ação — recriando uma mecânica clássica e reconhecível.',
      solution:
        'Recriação do Freeway do Atari: atravessar sucessivas faixas de trânsito desviando dos carros, com dificuldade crescente conforme o jogador avança.',
      process:
        'JavaScript puro com HTML5 Canvas pro loop de jogo e renderização, CSS pro layout ao redor do jogo. Deploy feito na Vercel, separado do GitHub Pages usado nos outros projetos.',
      result: 'Jogo publicado e jogável direto no navegador, sem instalação.',
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
