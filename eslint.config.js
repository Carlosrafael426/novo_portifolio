import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    // Arquivo de configuração de rotas, não um módulo de componente — o padrão de
    // colocar lazy() junto do createBrowserRouter é o recomendado pelo React Router.
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Cena react-three-fiber: buffers geométricos são construídos uma vez e mutados
    // imperativamente dentro de useFrame (fora do ciclo de render do React) — é
    // exatamente pra isso que useFrame existe, e é o mesmo padrão usado internamente
    // por @react-three/drei. As regras react-hooks/refs, /purity e /immutability são
    // voltadas ao React Compiler (DOM) e ainda não reconhecem esse padrão do R3F.
    files: ['src/components/common/HeroCanvas.tsx'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  eslintConfigPrettier,
);
