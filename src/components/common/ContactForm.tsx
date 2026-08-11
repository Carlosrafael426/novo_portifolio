import { useContactForm } from '@/hooks/useContactForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const inputClasses =
  'border-border bg-card text-foreground focus:border-accent mt-2 w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors';

export function ContactForm() {
  const { values, errors, status, statusMessage, handleChange, handleSubmit } = useContactForm();
  const isLoading = status === 'loading';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="text-muted font-mono text-xs tracking-wide uppercase"
        >
          Nome
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          value={values.name}
          onChange={(event) => handleChange('name', event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          className={inputClasses}
        />
        {errors.name ? (
          <p id="contact-name-error" className="mt-1 text-sm text-red-400">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="text-muted font-mono text-xs tracking-wide uppercase"
        >
          E-mail
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => handleChange('email', event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          className={inputClasses}
        />
        {errors.email ? (
          <p id="contact-email-error" className="mt-1 text-sm text-red-400">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="text-muted font-mono text-xs tracking-wide uppercase"
        >
          Mensagem
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={values.message}
          onChange={(event) => handleChange('message', event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={cn(inputClasses, 'resize-none')}
        />
        {errors.message ? (
          <p id="contact-message-error" className="mt-1 text-sm text-red-400">
            {errors.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Enviando…' : 'Enviar mensagem'}
      </Button>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          'font-mono text-xs',
          status === 'error' && 'text-red-400',
          status === 'success' && 'text-accent',
          (status === 'idle' || status === 'loading') && 'text-muted',
        )}
      >
        {statusMessage}
      </p>
    </form>
  );
}
