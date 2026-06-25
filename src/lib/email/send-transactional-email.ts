type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult = {
  sent: boolean;
  provider: 'resend' | 'none';
};

function resolveEmailFrom(): string | null {
  return process.env.EMAIL_FROM?.trim() || null;
}

function resolveResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

/**
 * Sends transactional email via Resend HTTP API when configured.
 * Returns `{ sent: false }` when email is not configured (caller still succeeds silently).
 */
export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = resolveResendApiKey();
  const from = resolveEmailFrom();
  if (!apiKey || !from) {
    return { sent: false, provider: 'none' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider error: ${response.status}`);
  }

  return { sent: true, provider: 'resend' };
}
