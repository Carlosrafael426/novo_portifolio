import type { AboutContent } from '@/types/about';

export const aboutContent: AboutContent = {
  paragraphs: [
    [
      { text: 'Sou ' },
      { text: 'Carlos Rafael, desenvolvedor Full Stack com foco em Front-end', strong: true },
      {
        text: ', apaixonado por transformar ideias em experiências digitais modernas, funcionais e que realmente fazem sentido para quem vai utilizá-las.',
      },
    ],
    [
      { text: 'Minha trajetória na programação começou com a vontade de criar mais do que apenas código: ' },
      {
        text: 'quero construir produtos que resolvam problemas, valorizem marcas e gerem resultados',
        strong: true,
      },
      {
        text: '. Desde que comecei minha formação Full Stack no DevClub, em novembro de 2025, venho colocando conhecimento em prática constantemente, desenvolvendo projetos reais e evoluindo a cada novo desafio — incluindo projetos desenvolvidos para clientes.',
      },
    ],
    [
      { text: 'Meu principal domínio está no desenvolvimento de interfaces utilizando ' },
      { text: 'React, TypeScript e Tailwind CSS', strong: true },
      {
        text: ', criando aplicações responsivas, organizadas, acessíveis e com atenção aos detalhes. Gosto de unir ',
      },
      { text: 'design, tecnologia e experiência do usuário', strong: true },
      {
        text: ' para transformar uma ideia em uma interface que não apenas funciona, mas transmite profissionalismo e confiança.',
      },
    ],
    [
      { text: 'Também possuo experiência com ' },
      { text: 'Node.js, Express e PostgreSQL', strong: true },
      {
        text: ', além de integração e consumo de APIs, autenticação, gerenciamento de dados e publicação de aplicações. Atualmente continuo aprofundando meus conhecimentos em back-end para ampliar minha capacidade de atuar em todo o ciclo de desenvolvimento de uma aplicação.',
      },
    ],
  ],
  transition: 'Mas, para mim, desenvolver não é simplesmente escrever código.',
  belief: 'É entender o problema, pensar na solução e transformar essa solução em algo que as pessoas tenham vontade de usar.',
  practice: [
    {
      text: 'Por isso, valorizo código limpo, componentes bem estruturados, nomes claros e decisões que tornam o projeto fácil de manter e evoluir. Acredito que um bom desenvolvedor não deve apenas entregar uma aplicação que funciona hoje, mas construir uma base preparada para o que o projeto pode se tornar amanhã.',
    },
  ],
  expectationsHeading: 'O que você pode esperar do meu trabalho',
  expectations: [
    {
      title: 'Interfaces modernas e responsivas',
      description: 'Experiências pensadas para funcionar bem em diferentes dispositivos e tamanhos de tela.',
    },
    {
      title: 'Código organizado e escalável',
      description: 'Desenvolvimento com foco em manutenção, reutilização e evolução do projeto.',
    },
    {
      title: 'Atenção aos detalhes',
      description:
        'Desde a experiência do usuário até pequenas interações que fazem uma interface parecer mais profissional.',
    },
    {
      title: 'Compromisso com o projeto',
      description:
        'Busco entender o objetivo do negócio para entregar uma solução alinhada às necessidades reais do cliente.',
    },
    {
      title: 'Evolução constante',
      description:
        'Tecnologia muda rapidamente, e eu acredito que um bom desenvolvedor precisa estar sempre aprendendo, testando e evoluindo.',
    },
  ],
  closing: [
    [
      {
        text: 'Se você tem uma ideia, um negócio que precisa de uma presença digital mais profissional ou um projeto que precisa sair do papel, ',
      },
      { text: 'vamos transformar essa ideia em algo real.', strong: true },
    ],
    [{ text: 'Você traz o desafio. Eu transformo em código, experiência e produto.', strong: true }],
  ],
};
