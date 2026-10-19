import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { BotHues, type BotHue } from "@/src/dict/bot-dict";

/**
 * The workspace a conversation is in; left out (or null) for a bot's own
 * chat.
 */
const WorkspaceIdField = z.coerce.number().int().positive().nullish();

export const SendBotMessageRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot to message"),
    workspace_id: WorkspaceIdField,
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
    /**
     * In a workspace this switches the workspace's default computer.
     */
    workspace_id: WorkspaceIdField,
});

export type SetBotComputerRequest = z.infer<typeof SetBotComputerRequestSchema>;

/**
 * Giving a bot direct access to a computer, or taking it away.
 */
export const BotComputerRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    computer_id: z.coerce.number().int().positive("Pick a computer"),
});

export type BotComputerRequest = z.infer<typeof BotComputerRequestSchema>;

export const BotSessionIdRequestSchema = z.object({
    session_id: z.coerce.number().int().positive("Pick a session"),
});

export type BotSessionIdRequest = z.infer<typeof BotSessionIdRequestSchema>;

export const BotConversationRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    workspace_id: WorkspaceIdField,
});

export type BotConversationRequest = z.infer<typeof BotConversationRequestSchema>;

export const ListBotSessionsRequestSchema = BotConversationRequestSchema.extend({
    query: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    /**
     * A handful for the rail's sub-list; the modal leaves it out for a page.
     */
    limit: z.coerce.number().int().positive().max(AppData.BotSessionsPageSize).optional(),
});

export type ListBotSessionsRequest = z.infer<typeof ListBotSessionsRequestSchema>;

export const CreateBotRequestSchema = z.object({
    name: z.string().trim().min(1, "Give the bot a name").max(40, "Keep the name under 40 characters"),
    role: z.string().trim().max(120, "Keep the role to one line").default(""),
    hue: z.enum(BotHues.map((h) => h.value) as [BotHue, ...BotHue[]]),
    system_prompt: z
        .string()
        .trim()
        .min(1, "Tell the bot what it does")
        .max(AppData.PromptMaxLength),
    /**
     * Also put it in this workspace.
     */
    workspace_id: WorkspaceIdField,
});

export type CreateBotRequest = z.infer<typeof CreateBotRequestSchema>;

/**
 * The coordinator keeps its name and has no hue: only its instructions
 * change.
 */
export const UpdateBotRequestSchema = CreateBotRequestSchema.omit({ workspace_id: true }).extend({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
});

export type UpdateBotRequest = z.infer<typeof UpdateBotRequestSchema>;

export const UploadBotAttachmentRequestSchema = z.object({
    /**
     * The file as a base64 data URL.
     */
    data_url: z.string().startsWith("data:", "Send the file as a data URL"),
    name: z.string().trim().min(1, "The file needs a name").max(255),
});

export type UploadBotAttachmentRequest = z.infer<typeof UploadBotAttachmentRequestSchema>;
