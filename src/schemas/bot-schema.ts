import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import {
    BotMessageReactions,
    BotStoneShapes,
    type BotMessageReactionEmoji,
    type BotStoneShape,
} from "@/src/dict/bot-dict";

/**
 * The workspace a conversation is in; left out (or null) for a bot's own
 * chat.
 */
const WorkspaceIdField = z.coerce.number().int().positive().nullish();

export const SaveSystemPromptAppendRequestSchema = z.object({
    text: z
        .string()
        .trim()
        .max(
            AppData.PromptMaxLength,
            `Keep it under ${AppData.PromptMaxLength} characters`,
        )
        .default(""),
});

/**
 * How many messages a session takes before the next one starts (Settings >
 * General). Zero puts the code's default back.
 */
export const SaveSessionLengthRequestSchema = z.object({
    max_messages: z.coerce.number().int().min(0).max(AppData.BotSessionMaxMessagesMax),
});

export const SendBotMessageRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot to message"),
    workspace_id: WorkspaceIdField,
    text: z.string().trim().max(4000, "Keep messages under 4000 characters").default(""),
    media_ids: z
        .array(z.coerce.number().int().positive())
        .max(AppData.BotAttachmentMaxFiles, `Attach up to ${AppData.BotAttachmentMaxFiles} files`)
        .default([]),
    /**
     * The message this one replies to, quoted above it.
     */
    reply_to_message_id: z.coerce.number().int().positive().nullish(),
}).refine((body) => body.text || body.media_ids.length, "Write a message or attach a file first");

export type SendBotMessageRequest = z.infer<typeof SendBotMessageRequestSchema>;

/**
 * Toggling one of the fixed reactions on a message.
 */
export const ReactToBotMessageRequestSchema = z.object({
    message_id: z.coerce.number().int().positive("Pick a message"),
    emoji: z.enum(
        BotMessageReactions.map((reaction) => reaction.value) as [
            BotMessageReactionEmoji,
            ...BotMessageReactionEmoji[],
        ],
    ),
});

export type ReactToBotMessageRequest = z.infer<typeof ReactToBotMessageRequestSchema>;

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

/**
 * A page of a session's messages before `before_id`, or (left out) its
 * latest: the previous session opened above a thread.
 */
export const OlderBotMessagesRequestSchema = BotSessionIdRequestSchema.extend({
    before_id: z.coerce.number().int().positive("Pick a message").nullish(),
});

export type OlderBotMessagesRequest = z.infer<typeof OlderBotMessagesRequestSchema>;

export const BotConversationRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    workspace_id: WorkspaceIdField,
});

export type BotConversationRequest = z.infer<typeof BotConversationRequestSchema>;

/**
 * A conversation's history: its active session, or the one the page's
 * `?session_id=` names.
 */
export const ConversationHistoryRequestSchema = BotConversationRequestSchema.extend({
    session_id: z.coerce.number().int().positive().nullish(),
});

export type ConversationHistoryRequest = z.infer<typeof ConversationHistoryRequestSchema>;

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
    /**
     * Its identity colour, `#rrggbb`.
     */
    color: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^#[0-9a-f]{6}$/, "Pick a colour like #7c5cd6"),
    /**
     * Which flat-cut stone it's drawn on.
     */
    stone: z.enum(BotStoneShapes.map((s) => s.value) as [BotStoneShape, ...BotStoneShape[]]),
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

export const TranscribeVoiceRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    workspace_id: WorkspaceIdField,
    /**
     * The recording as a base64 data URL.
     */
    data_url: z.string().startsWith("data:audio/", "Send the recording as an audio data URL"),
});

export type TranscribeVoiceRequest = z.infer<typeof TranscribeVoiceRequestSchema>;

export const SpeakBotMessageRequestSchema = z.object({
    message_id: z.coerce.number().int().positive("Pick a message"),
});

export type SpeakBotMessageRequest = z.infer<typeof SpeakBotMessageRequestSchema>;

export const MessageDetailsRequestSchema = z.object({
    message_id: z.coerce.number().int().positive("Pick a message"),
});

export type MessageDetailsRequest = z.infer<typeof MessageDetailsRequestSchema>;
