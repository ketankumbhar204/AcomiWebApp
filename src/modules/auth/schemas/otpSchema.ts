import { z } from 'zod';

export function createOtpSchema(messages: { required: string; invalid: string }) {
  return z.object({
    otp: z
      .string()
      .trim()
      .min(1, messages.required)
      .regex(/^\d{6}$/, messages.invalid),
  });
}

export type OtpFormValues = z.infer<ReturnType<typeof createOtpSchema>>;
