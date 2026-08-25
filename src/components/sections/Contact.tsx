import { Section } from '@/components/ui/Section';
import { ContactCTA } from '@/components/common/ContactCTA';
import { ContactForm } from '@/components/common/ContactForm';

/** Traço decorativo tipo trilha de circuito, saindo da segunda linha do título — mesmo motivo
 *  visual usado no título da seção Stack. */
function TitleConnector() {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 24" className="text-accent/50 hidden h-6 min-w-20 flex-1 sm:block">
      <path d="M0 12H80L96 20H132" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="138" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function Contact() {
  return (
    <Section
      id="contato"
      eyebrow="05 / Contato"
      title={
        <span className="block">
          <span className="block">Vamos</span>
          <span className="flex flex-wrap items-center gap-4">
            <span>Criar algo</span>
            <TitleConnector />
          </span>
          <span className="text-accent block">Extraordinário</span>
        </span>
      }
    >
      <div className="grid gap-12 md:grid-cols-2">
        <ContactCTA />
        <ContactForm />
      </div>
    </Section>
  );
}
