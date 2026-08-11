import type { Technology } from '@/types/technology';

export const technologies: Technology[] = [
  { id: 'react', name: 'React', category: 'frontend', level: 'principal' },
  { id: 'typescript', name: 'TypeScript', category: 'frontend', level: 'principal' },
  { id: 'javascript', name: 'JavaScript', category: 'frontend', level: 'principal' },
  { id: 'html', name: 'HTML5', category: 'frontend', level: 'principal' },
  { id: 'css', name: 'CSS3', category: 'frontend', level: 'principal' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', level: 'principal' },
  { id: 'vite', name: 'Vite', category: 'frontend', level: 'principal' },

  { id: 'nodejs', name: 'Node.js', category: 'backend', level: 'estudando' },
  { id: 'express', name: 'Express', category: 'backend', level: 'estudando' },
  { id: 'rest', name: 'APIs REST', category: 'backend', level: 'apoio' },

  { id: 'postgresql', name: 'PostgreSQL', category: 'database', level: 'estudando' },

  { id: 'git', name: 'Git', category: 'infrastructure', level: 'principal' },
  { id: 'github', name: 'GitHub', category: 'infrastructure', level: 'principal' },
  { id: 'vercel', name: 'Vercel', category: 'infrastructure', level: 'apoio' },
  { id: 'figma', name: 'Figma', category: 'infrastructure', level: 'apoio' },
];
