import { Section } from '@/components/ui/Section';
import { aboutContent } from '@/data/about';
import { technologies } from '@/data/technologies';

const stats = [
  { value: `${technologies.length}+`, label: 'Tecnologias' },
  { value: '∞', label: 'Curiosidade' },
  { value: '01', label: 'Dev Full Stack' },
];

export function About() {
  return (
    <Section id="sobre" eyebrow="02 / Identidade" title="Quem sou eu">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr_200px]">
        <div className="border-border bg-card rounded-lg border p-4 font-mono text-xs">
          <p className="text-muted mb-3 tracking-wide uppercase">Sistema.info</p>
          <ul className="space-y-2">
            {aboutContent.values.map((value) => (
              <li key={value} className="text-foreground flex gap-2">
                <span className="text-accent">&gt;</span> {value}
              </li>
            ))}
          </ul>
        </div>

        <div>
          {aboutContent.bio.map((paragraph, index) => (
            <p key={index} className="text-muted mt-4 leading-relaxed first:mt-0">
              {paragraph}
            </p>
          ))}

          <p className="text-foreground border-accent mt-6 border-l-2 pl-4 italic">
            {aboutContent.philosophy}
          </p>

          <ul className="text-muted mt-6 space-y-1 text-sm">
            {aboutContent.lookingFor.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent" aria-hidden="true">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <dl className="flex flex-row gap-8 lg:flex-col lg:gap-6">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-accent font-display text-3xl font-bold">{stat.value}</dt>
              <dd className="text-muted mt-1 font-mono text-xs tracking-wide uppercase">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
