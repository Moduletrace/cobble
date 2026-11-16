import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { BotPlanSettableStates, BotPlanStepStates } from "@/src/dict/bot-plan-dict";

/**
 * One step a plan holds, as it's stored and read back.
 */
export const BotPlanStepSchema = z.object({
    text: z
        .string()
        .trim()
        .min(1, `Write every step`)
        .max(AppData.BotPlanStepMaxChars, `Keep each step under ${AppData.BotPlanStepMaxChars} characters`),
    state: z.enum(BotPlanStepStates.map((state) => state.value) as [string, ...string[]]).optional(),
    note: z.string().trim().max(AppData.BotPlanStepNoteMaxChars).optional(),
});

/**
 * The steps a bot writes (`create_plan`, `update_plan`): one line each, in
 * the order they're worked, and distinct, since two the same read as a
 * mistake on the card.
 */
export const BotPlanStepTextsSchema = z
    .array(
        z
            .string()
            .trim()
            .min(1, `Write every step`)
            .max(AppData.BotPlanStepMaxChars, `Keep each step under ${AppData.BotPlanStepMaxChars} characters`),
    )
    .min(1, `A plan needs at least one step`)
    .max(AppData.BotPlanMaxSteps, `Keep a plan to ${AppData.BotPlanMaxSteps} steps`)
    .refine((steps) => new Set(steps.map((step) => step.toLowerCase())).size == steps.length, `Steps must differ`);

export const BotPlanTitleSchema = z
    .string()
    .trim()
    .min(1, `Give the plan a title`)
    .max(AppData.BotPlanTitleMaxChars, `Keep the title under ${AppData.BotPlanTitleMaxChars} characters`);

export const BotPlanGoalSchema = z
    .string()
    .trim()
    .max(AppData.BotPlanGoalMaxChars, `Keep the goal under ${AppData.BotPlanGoalMaxChars} characters`)
    .optional();

/**
 * What the user changing a plan's steps sends: the whole list, the steps
 * already done included (`saveBotPlanSteps` refuses to change or drop
 * those).
 */
export const SaveBotPlanSchema = z.object({
    plan_id: z.coerce.number().int().positive(`Pick the plan`),
    title: BotPlanTitleSchema,
    goal: BotPlanGoalSchema,
    steps: BotPlanStepTextsSchema,
});

export const GetBotPlanSchema = z.object({
    plan_id: z.coerce.number().int().positive(`Pick the plan`),
});

/**
 * Where the user moves a plan from its card: approve it (or pick it back
 * up), pause it, or end it.
 */
export const SetBotPlanStateSchema = z.object({
    plan_id: z.coerce.number().int().positive(`Pick the plan`),
    status: z.enum(BotPlanSettableStates as [string, ...string[]]),
});

export type SaveBotPlanRequest = z.infer<typeof SaveBotPlanSchema>;
export type SetBotPlanStateRequest = z.infer<typeof SetBotPlanStateSchema>;