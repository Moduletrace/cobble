import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * How many days a run's detailed trace is kept (Settings > General). Zero
 * puts the code's default back.
 */
export const SaveBotTraceRetentionRequestSchema = z.object({
    keep_days: z.coerce.number().int().min(0).max(AppData.BotTraceKeepDaysMax),
});

/**
 * The message whose run's debug logs are wanted.
 */
export const BotMessageTraceRequestSchema = z.object({
    message_id: z.coerce.number().int().positive("Pick a message"),
});