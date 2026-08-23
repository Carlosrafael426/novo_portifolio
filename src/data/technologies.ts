import type { Technology } from '@/types/technology';

export const technologies: Technology[] = [
  { id: 'react', name: 'React', category: 'frontend', progress: 100 },
  { id: 'typescript', name: 'TypeScript', category: 'frontend', progress: 100 },
  { id: 'javascript', name: 'JavaScript', category: 'frontend', progress: 100 },
  { id: 'html', name: 'HTML5', category: 'frontend', progress: 100 },
  { id: 'css', name: 'CSS3', category: 'frontend', progress: 100 },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', progress: 100 },
  { id: 'vite', name: 'Vite', category: 'frontend', progress: 100 },

  { id: 'nodejs', name: 'Node.js', category: 'backend', progress: 90 },
  { id: 'express', name: 'Express', category: 'backend', progress: 90 },
  { id: 'rest', name: 'APIs REST', category: 'backend', progress: 75 },

  { id: 'postgresql', name: 'PostgreSQL', category: 'database', progress: 95 },

  { id: 'git', name: 'Git', category: 'infrastructure', progress: 100 },
  { id: 'github', name: 'GitHub', category: 'infrastructure', progress: 100 },
  { id: 'vercel', name: 'Vercel', category: 'infrastructure', progress: 75 },
  { id: 'figma', name: 'Figma', category: 'infrastructure', progress: 75 },
];
