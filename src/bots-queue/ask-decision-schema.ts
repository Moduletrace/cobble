import { z } from "zod";
import { AskDecisionValues } from "@/src/dict/ask-dict";

/**
 * What the gate may answer, and nothing else: a decision, the bot to pass the
 * request to when there is one, and a reason an asking bot can act on.
 */
export const AskDecisionSchema = z.object({
    decision: z.enum(AskDecisionValues),
    target_bot_id: z.number().int().positive().optional(),
    reason: z.string().trim().min(1).max(600),
});

export type AskDecisionPlan = z.infer<typeof AskDecisionSchema>;
