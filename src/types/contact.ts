export type ContactFormStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;
