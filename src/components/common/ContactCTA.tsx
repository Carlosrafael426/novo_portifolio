import { SocialLinks } from '@/components/common/SocialLinks';

export function ContactCTA() {
  return (
    <div>
      <p className="text-muted max-w-sm">
        Aberto a novas oportunidades e projetos. Envie uma mensagem pelo formulário ou entre em
        contato diretamente pelos links abaixo.
      </p>
      <div className="mt-8">
        <SocialLinks />
      </div>
    </div>
  );
}
