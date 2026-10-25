import { z } from "zod";

export const SecretRequestIdSchema = z.object({
    request_id: z.coerce.number().int().positive("Pick a request"),
});

export const AnswerSecretRequestSchema = z.object({
    request_id: z.coerce.number().int().positive("Pick a request"),
    value: z.string().min(1, "Enter a value").max(20000, "Keep values under 20,000 characters"),
});

export const SecretIdSchema = z.object({
    env_id: z.coerce.number().int().positive("Pick a secret"),
});

export const SaveUserSecretSchema = z.object({
    env_id: z.coerce.number().int().positive("Pick a secret"),
    value: z.string().min(1, "Enter a value").max(20000, "Keep values under 20,000 characters"),
});

export type SecretRequestIdRequest = z.infer<typeof SecretRequestIdSchema>;
export type AnswerSecretRequestRequest = z.infer<typeof AnswerSecretRequestSchema>;
export type SecretIdRequest = z.infer<typeof SecretIdSchema>;
export type SaveUserSecretRequest = z.infer<typeof SaveUserSecretSchema>;
