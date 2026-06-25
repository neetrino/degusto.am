import { z } from 'zod';

const mfaCodeSchema = z.string().regex(/^\d{6}$/, 'Code must be 6 digits');

export const mfaConfirmSetupSchema = z.object({
  secret: z.string().min(16),
  code: mfaCodeSchema,
});

export const mfaDisableSchema = z.object({
  code: mfaCodeSchema,
});

export const mfaVerifySchema = z.object({
  mfaToken: z.string().min(1),
  code: mfaCodeSchema,
});

export function safeParseMfaConfirmSetup(body: unknown) {
  return mfaConfirmSetupSchema.safeParse(body);
}

export function safeParseMfaDisable(body: unknown) {
  return mfaDisableSchema.safeParse(body);
}

export function safeParseMfaVerify(body: unknown) {
  return mfaVerifySchema.safeParse(body);
}
