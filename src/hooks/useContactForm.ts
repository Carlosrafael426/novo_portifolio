import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ContactFormErrors, ContactFormStatus, ContactFormValues } from '@/types/contact';
import { submitContactForm } from '@/services/contactService';

const initialValues: ContactFormValues = { name: '', email: '', message: '' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = 'Me diz seu nome.';
  }

  if (!emailPattern.test(values.email)) {
    errors.email = 'Esse e-mail não parece válido.';
  }

  if (values.message.trim().length < 10) {
    errors.message = 'Escreve um pouco mais para eu entender o contexto.';
  }

  return errors;
}

interface UseContactFormResult {
  values: ContactFormValues;
  errors: ContactFormErrors;
  status: ContactFormStatus;
  statusMessage: string | null;
  handleChange: (field: keyof ContactFormValues, value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useContactForm(): UseContactFormResult {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<ContactFormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function handleChange(field: keyof ContactFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setStatus('loading');
    setStatusMessage(null);

    submitContactForm(values)
      .then((result) => {
        setStatus(result.success ? 'success' : 'error');
        setStatusMessage(result.message);

        if (result.success) {
          setValues(initialValues);
        }
      })
      .catch(() => {
        setStatus('error');
        setStatusMessage('Não consegui enviar. Tenta de novo ou me chama no e-mail.');
      });
  }

  return { values, errors, status, statusMessage, handleChange, handleSubmit };
}
