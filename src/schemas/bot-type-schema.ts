import { z } from "zod";

/**
 * Giving a bot a workspace type, or taking it away: today, making it the
 * workspace's admin.
 */
export const SetBotTypeRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    workspace_id: z.coerce.number().int().positive("Pick a workspace"),
    bot_type: z.enum(["admin"]).default("admin"),
    given: z.boolean(),
});

export type SetBotTypeRequest = z.infer<typeof SetBotTypeRequestSchema>;
