# Carlos Rafael — Portfólio (Fase 1: Estrutura)

Portfólio pessoal de Carlos Rafael, Full Stack Developer. Este repositório está na **Fase 1**:
apenas arquitetura, tipagem e conteúdo (real ou placeholder) — sem identidade visual definitiva.
A **Fase 2** trará a experiência "Digital System / Neural Experience" (GSAP, Three.js/React
Three Fiber, WebGL).

## Stack

- React 19 + TypeScript (strict)
- Vite
- Tailwind CSS v4 (CSS-first, `@theme`)
- React Router (data router)
- lucide-react
- ESLint + Prettier
- GSAP, Three.js, @react-three/fiber, @react-three/drei — instalados, ainda sem uso (preparados para a Fase 2)

## Instalação

```bash
npm install
```

## Scripts

| Comando                | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Sobe o servidor de desenvolvimento       |
| `npm run build`        | Typecheck (`tsc -b`) + build de produção |
| `npm run preview`      | Serve o build de produção localmente     |
| `npm run lint`         | Roda o ESLint                            |
| `npm run lint:fix`     | Roda o ESLint com autofix                |
| `npm run typecheck`    | Apenas o typecheck (`tsc -b --noEmit`)   |
| `npm run format`       | Formata o projeto com Prettier           |
| `npm run format:check` | Verifica formatação sem alterar arquivos |

## Estrutura de pastas

```
src/
├── components/
│   ├── ui/        # Primitivos: Button, Container, Section, SectionTitle, Badge...
│   ├── layout/     # Navbar, Footer, RootLayout, RouteErrorBoundary
│   ├── sections/  # Uma seção da Home por arquivo (Hero, About, Stack...)
│   └── common/    # Componentes reutilizáveis que recebem dados via props
├── data/          # Conteúdo tipado (projetos, tecnologias, experiência...)
├── hooks/         # useActiveSection, useHashScroll, useContactForm, useDocumentTitle
├── pages/         # HomePage, ProjectDetailPage, NotFoundPage (lazy-loaded)
├── routes/        # router.tsx (createBrowserRouter)
├── services/      # contactService.ts — mock de envio, isolado para troca futura por API real
├── styles/        # tokens.css (design tokens estruturais) + globals.css
├── types/         # Interfaces centrais (Project, Technology, Experience...)
└── utils/         # cn(), groupBy()
```

## Decisões arquiteturais

- **Conteúdo**: nome, título, labels de navegação, headlines de seção e a stack técnica são
  conteúdo real. Projetos, bio, experiência profissional e AI Lab são placeholder — marcados
  explicitamente com `[Placeholder]` no texto ou `// TODO` no código — até serem preenchidos.
- **Roteamento**: Home (`/`) e detalhe de projeto (`/projects/:slug`) via `createBrowserRouter`.
  Navegar de uma âncora em outra rota de volta pra Home usa hash de URL (`useHashScroll`), que
  sobrevive a refresh e gera links compartilháveis.
- **GSAP/Three.js**: instalados no `package.json` mas não importados em nenhum componente —
  zero custo no bundle atual. `HeroCanvasSlot` é o ponto de integração já preparado para a Fase 2.
- **Sem paleta de cor customizada**: apenas cores neutras padrão do Tailwind, para as seções
  ficarem distinguíveis sem antecipar decisões visuais da Fase 2.

## TODO (preencher antes da Fase 2)

- Links reais de GitHub, LinkedIn e e-mail em `src/data/social.ts`.
- Conteúdo real de projetos, bio, experiência e AI Lab em `src/data/`.
- Descrições reais das camadas em `src/data/engine.ts`.
- Favicon e imagem de Open Graph definitivos (hoje são placeholders neutros).
- Integração real de `src/services/contactService.ts` com uma API de envio.
