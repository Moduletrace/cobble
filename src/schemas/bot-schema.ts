import { z } from "zod";
import { AppData } from "@/src/data/app-data";

export const SendBotMessageRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot to message"),
    text: z.string().trim().max(4000, "Keep messages under 4000 characters").default(""),
    media_ids: z
        .array(z.coerce.number().int().positive())
        .max(AppData.BotAttachmentMaxFiles, `Attach up to ${AppData.BotAttachmentMaxFiles} files`)
        .default([]),
}).refine((body) => body.text || body.media_ids.length, "Write a message or attach a file first");

export type SendBotMessageRequest = z.infer<typeof SendBotMessageRequestSchema>;

export const BotIdRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
});

export type BotIdRequest = z.infer<typeof BotIdRequestSchema>;

export const SetBotComputerRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    computer_id: z.coerce.number().int().positive("Pick a computer"),
});

export type SetBotComputerRequest = z.infer<typeof SetBotComputerRequestSchema>;

export const UploadBotAttachmentRequestSchema = z.object({
    /**
     * The file as a base64 data URL.
     */
    data_url: z.string().startsWith("data:", "Send the file as a data URL"),
    name: z.string().trim().min(1, "The file needs a name").max(255),
});

export type UploadBotAttachmentRequest = z.infer<typeof UploadBotAttachmentRequestSchema>;
