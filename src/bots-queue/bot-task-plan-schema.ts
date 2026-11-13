import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * The plan a task run writes for itself before its first step
 * (`planBotTask`). Validated because it comes back from a model: anything
 * that doesn't fit starts the run unplanned instead of steered by
 * nonsense.
 */
export const BotTaskPlanSchema = z.object({
    goal: z.string().trim().min(1).max(AppData.BotTaskPlanTextMaxChars),
    gather: z.array(z.string().trim().min(1)).max(AppData.BotTaskPlanMaxGather).default([]),
    steps: z.array(z.string().trim().min(1)).min(1).max(AppData.BotTaskPlanMaxSteps),
    done: z.string().trim().max(AppData.BotTaskPlanTextMaxChars).default(""),
});

export type BotTaskPlan = z.infer<typeof BotTaskPlanSchema>;