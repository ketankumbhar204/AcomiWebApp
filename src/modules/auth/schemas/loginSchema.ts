import { z } from 'zod';
import { INDIAN_MOBILE_REGEX } from '@/shared/utils/indianMobile';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../passwordRules';

export function createLoginSchema(messages: {
  mobileRequired: string;
  mobileInvalid: string;
  passwordRequired: string;
  passwordTooShort: string;
  passwordTooLong: string;
}) {
  return z.object({
    mobileNumber: z
      .string()
      .trim()
      .min(1, messages.mobileRequired)
      .regex(INDIAN_MOBILE_REGEX, messages.mobileInvalid),
    password: z
      .string()
      .min(1, messages.passwordRequired)
      .min(PASSWORD_MIN_LENGTH, messages.passwordTooShort)
      .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createSendOtpSchema(messages: {
  mobileRequired: string;
  mobileInvalid: string;
}) {
  return z.object({
    mobileNumber: z
      .string()
      .trim()
      .min(1, messages.mobileRequired)
      .regex(INDIAN_MOBILE_REGEX, messages.mobileInvalid),
  });
}

export type SendOtpFormValues = z.infer<ReturnType<typeof createSendOtpSchema>>;

export function createRegisterPasswordSchema(messages: {
  nameRequired: string;
  passwordRequired: string;
  passwordTooShort: string;
  passwordTooLong: string;
  confirmRequired: string;
  passwordMismatch: string;
}) {
  return z
    .object({
      fullName: z.string().trim().min(1, messages.nameRequired).max(255),
      password: z
        .string()
        .min(1, messages.passwordRequired)
        .min(PASSWORD_MIN_LENGTH, messages.passwordTooShort)
        .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong),
      confirmPassword: z.string().min(1, messages.confirmRequired),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type RegisterPasswordFormValues = z.infer<
  ReturnType<typeof createRegisterPasswordSchema>
>;

export function createRegisterSchema(messages: {
  nameRequired: string;
  mobileRequired: string;
  mobileInvalid: string;
  passwordRequired: string;
  passwordTooShort: string;
  passwordTooLong: string;
  confirmRequired: string;
  passwordMismatch: string;
}) {
  return z
    .object({
      fullName: z.string().trim().min(1, messages.nameRequired).max(255),
      mobileNumber: z
        .string()
        .trim()
        .min(1, messages.mobileRequired)
        .regex(INDIAN_MOBILE_REGEX, messages.mobileInvalid),
      password: z
        .string()
        .min(1, messages.passwordRequired)
        .min(PASSWORD_MIN_LENGTH, messages.passwordTooShort)
        .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong),
      confirmPassword: z.string().min(1, messages.confirmRequired),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
