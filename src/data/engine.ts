import type { EngineLayer } from '@/types/engine';

export const engineLayers: EngineLayer[] = [
  {
    id: 'user',
    label: 'Usuário',
    description:
      'Onde tudo começa. Antes de escrever componente, eu defino o que a pessoa precisa fazer e em quantos cliques.',
  },
  {
    id: 'frontend',
    label: 'Front-end',
    description:
      'React com TypeScript e Tailwind. Componentes pequenos, estado no nível mais baixo que resolve e layout responsivo desde o primeiro rascunho.',
  },
  {
    id: 'api',
    label: 'API',
    description:
      'Camada de comunicação isolada em services/. Nenhum componente chama fetch direto — assim trocar a fonte de dados não espalha mudança pela árvore.',
  },
  {
    id: 'backend',
    label: 'Back-end',
    description:
      'Node com Express expondo rotas REST, validação de entrada e autenticação por token. Território onde ainda estou aprendendo.',
  },
  {
    id: 'database',
    label: 'Banco de dados',
    description:
      'PostgreSQL para o que precisa sobreviver ao refresh. Modelagem simples, consultas diretas, sem ORM por enquanto.',
  },
];
