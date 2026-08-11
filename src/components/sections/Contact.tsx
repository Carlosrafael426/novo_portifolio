import { Section } from '@/components/ui/Section';
import { ContactCTA } from '@/components/common/ContactCTA';
import { ContactForm } from '@/components/common/ContactForm';

export function Contact() {
  return (
    <Section id="contato" eyebrow="07 / Contato" title="Vamos conversar">
      <div className="grid gap-12 md:grid-cols-2">
        <ContactCTA />
        <ContactForm />
      </div>
    </Section>
  );
}
