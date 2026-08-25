import { Lock, Mail, PenLine, Send, Tag, User } from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm';
import { ClippedPanel } from '@/components/ui/ClippedPanel';
import { cn } from '@/utils/cn';

const inputClasses =
  'border-border bg-background text-foreground focus:border-accent mt-2 w-full rounded-md border py-2.5 pr-10 pl-3 text-sm outline-none transition-colors';

interface FieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  icon: typeof User;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function Field({ id, name, label, type = 'text', icon: Icon, value, error, required, onChange }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-muted flex items-center gap-2 font-mono text-xs tracking-wide uppercase">
        <span aria-hidden="true" className="bg-accent h-1 w-1 rounded-full" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required}
          className={inputClasses}
        />
        <Icon aria-hidden="true" size={16} className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ContactForm() {
  const { values, errors, status, statusMessage, handleChange, handleSubmit } = useContactForm();
  const isLoading = status === 'loading';

  return (
    <ClippedPanel corners="all" cut={20} className="p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field
          id="contact-name"
          name="name"
          label="Nome"
          icon={User}
          value={values.name}
          error={errors.name}
          required
          onChange={(value) => handleChange('name', value)}
        />

        <Field
          id="contact-email"
          name="email"
          label="E-mail"
          type="email"
          icon={Mail}
          value={values.email}
          error={errors.email}
          required
          onChange={(value) => handleChange('email', value)}
        />

        <Field
          id="contact-subject"
          name="subject"
          label="Assunto"
          icon={Tag}
          value={values.subject}
          onChange={(value) => handleChange('subject', value)}
        />

        <div>
          <label
            htmlFor="contact-message"
            className="text-muted flex items-center gap-2 font-mono text-xs tracking-wide uppercase"
          >
            <span aria-hidden="true" className="bg-accent h-1 w-1 rounded-full" />
            Sua mensagem
          </label>
          <div className="relative">
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              value={values.message}
              onChange={(event) => handleChange('message', event.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
              aria-required
              className={cn(inputClasses, 'resize-none')}
            />
            <PenLine aria-hidden="true" size={16} className="text-muted pointer-events-none absolute right-3 bottom-3" />
          </div>
          {errors.message ? (
            <p id="contact-message-error" className="mt-1 text-sm text-red-400">
              {errors.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-accent text-accent-foreground hover:bg-accent/85 flex w-full items-center justify-center gap-2 rounded-md py-3.5 font-mono text-sm font-bold tracking-wider uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Enviando…' : 'Enviar mensagem'}
          <Send aria-hidden="true" size={16} />
        </button>

        <p className="text-muted flex items-center justify-center gap-1.5 text-center text-xs">
          <Lock aria-hidden="true" size={12} />
          Suas informações estão seguras e não serão compartilhadas.
        </p>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            'text-center font-mono text-xs',
            status === 'error' && 'text-red-400',
            status === 'success' && 'text-accent',
            (status === 'idle' || status === 'loading') && 'text-muted',
          )}
        >
          {statusMessage}
        </p>
      </form>
    </ClippedPanel>
  );
}
