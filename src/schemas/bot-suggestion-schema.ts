import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * The next steps a bot suggests (`suggest_next_steps`), as it writes them
 * and as they're stored: short enough to read as a button, distinct so a
 * step is never offered twice.
 */
export const BotSuggestionStepsSchema = z
    .array(z.string().trim().min(1).max(AppData.BotSuggestionStepMaxChars, `Keep each step under ${AppData.BotSuggestionStepMaxChars} characters`))
    .min(1, "Suggest at least one next step")
    .max(AppData.BotSuggestionMaxSteps, `Suggest at most ${AppData.BotSuggestionMaxSteps} next steps`)
    .refine((steps) => new Set(steps.map((step) => step.toLowerCase())).size == steps.length, "Steps must differ");

export const BotSuggestionIdSchema = z.object({
    suggestion_id: z.coerce.number().int().positive("Pick the suggestions"),
});

export type BotSuggestionIdRequest = z.infer<typeof BotSuggestionIdSchema>;