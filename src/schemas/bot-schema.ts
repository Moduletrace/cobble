import { z } from "zod";

export const SendBotMessageRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot to message"),
    text: z
        .string()
        .trim()
        .min(1, "Write a message first")
        .max(4000, "Keep messages under 4000 characters"),
});

export type SendBotMessageRequest = z.infer<typeof SendBotMessageRequestSchema>;
