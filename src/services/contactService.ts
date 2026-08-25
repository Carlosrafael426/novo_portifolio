export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  message: string;
}

/** TODO (Fase 2/3): substituir pela chamada real a uma API de envio (ex: VITE_CONTACT_API_URL). */
export async function submitContactForm(data: ContactSubmission): Promise<ContactSubmissionResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  console.log('[contactService] Envio simulado:', data);

  return {
    success: true,
    message: 'Mensagem enviada, obrigado!',
  };
}
