import { z } from 'zod';
import { INDIAN_MOBILE_REGEX } from '@/shared/utils/indianMobile';

export function createLoginSchema(messages: {
  required: string;
  invalid: string;
}) {
  return z.object({
    mobileNumber: z
      .string()
      .trim()
      .min(1, messages.required)
      .regex(INDIAN_MOBILE_REGEX, messages.invalid),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
