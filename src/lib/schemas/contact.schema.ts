import { z } from "zod";
import { isValidEmail } from "@/lib/utils/email";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Field 'name' is required"),
  email: z
    .string()
    .trim()
    .min(1, "Field 'email' is required")
    .refine((value) => isValidEmail(value), {
      message: "Invalid email format",
    }),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(1, "Field 'message' is required"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function safeParseContact(body: unknown): ReturnType<typeof contactSchema.safeParse> {
  return contactSchema.safeParse(body);
}
