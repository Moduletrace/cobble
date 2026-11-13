import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { Harnesses, type HarnessKind } from "@/src/dict/harness-dict";
import {
    HarnessProviderKinds,
    type HarnessProviderKind,
} from "@/src/dict/harness-provider-dict";

const ProviderIdSchema = z.coerce
    .number()
    .int()
    .positive("Pick a provider");

export const SaveHarnessProviderRequestSchema = z.object({
    provider_id: ProviderIdSchema.optional(),
    kind: z.enum(
        HarnessProviderKinds.map((kind) => kind.value) as [
            HarnessProviderKind,
            ...HarnessProviderKind[],
        ],
        "Pick a provider type",
    ),
    name: z.string().trim().max(80, "Keep the name under 80 characters").optional(),
    base_url: z.string().trim().max(500, "That address is too long").optional(),
    api_key: z.string().trim().max(1000, "That key is too long").optional(),
    clear_key: z.boolean().optional(),
    enabled: z.boolean(),
    /**
     * The window, in tokens, every model this provider lists without one of
     * its own is given: 0 or empty leaves them unknown, so a run assumes
     * `AppData.HarnessUnknownContextWindow`.
     */
    context_length: z.coerce
        .number()
        .int()
        .refine(
            (value) =>
                value == 0 ||
                (value >= AppData.HarnessProviderContextMin &&
                    value <= AppData.HarnessProviderContextMax),
            {
                message: `A window must be 0 (unknown) or between ${AppData.HarnessProviderContextMin.toLocaleString("en-US")} and ${AppData.HarnessProviderContextMax.toLocaleString("en-US")} tokens.`,
            },
        )
        .default(0),
});

export const HarnessProviderIdRequestSchema = z.object({
    provider_id: ProviderIdSchema,
});

export const SaveHarnessSettingsRequestSchema = z.object({
    settings: z
        .array(
            z.object({
                harness: z.enum(
                    Harnesses.map((harness) => harness.value) as [
                        HarnessKind,
                        ...HarnessKind[],
                    ],
                ),
                model_id: z.coerce.number().int().positive().nullable(),
                provider_id: z.coerce.number().int().positive().nullable().optional(),
                fallback: z.boolean(),
                enabled: z.boolean(),
                voice: z.string().trim().max(200).optional(),
                /**
                 * Text only: the model looks at images itself when it can.
                 */
                sees_images: z.boolean().optional(),
                /**
                 * Text only: models tried in order after the pick, before
                 * the automatic picks.
                 */
                fallback_model_ids: z
                    .array(z.coerce.number().int().positive())
                    .max(AppData.HarnessTextFallbackModelsMax, `Pick at most ${AppData.HarnessTextFallbackModelsMax} fallback models.`)
                    .optional(),
                /**
                 * Generation settings (temperature, reasoning effort, ...).
                 * Only the ones in `HarnessParameters` are kept.
                 */
                params: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
            }),
        )
        .min(1, "Nothing to save")
        .max(Harnesses.length),
});

/**
 * A worker bot's own model settings. `inherit` drops the bot's setting
 * for that harness so it uses the default again.
 */
export const SaveBotHarnessSettingsRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive(),
    settings: z
        .array(
            SaveHarnessSettingsRequestSchema.shape.settings.element.extend({
                inherit: z.boolean().default(false),
            }),
        )
        .min(1, "Nothing to save")
        .max(Harnesses.length),
});

/**
 * A workspace's own model settings. `inherit` drops the workspace's
 * setting for that harness so each bot uses its own or the default again.
 */
export const SaveWorkspaceHarnessSettingsRequestSchema = SaveBotHarnessSettingsRequestSchema.omit({
    bot_id: true,
}).extend({
    workspace_id: z.coerce.number().int().positive(),
});

export type SaveWorkspaceHarnessSettingsRequest = z.infer<
    typeof SaveWorkspaceHarnessSettingsRequestSchema
>;

export type SaveHarnessProviderRequest = z.infer<
    typeof SaveHarnessProviderRequestSchema
>;
export type SaveHarnessSettingsRequest = z.infer<
    typeof SaveHarnessSettingsRequestSchema
>;
export type SaveBotHarnessSettingsRequest = z.infer<
    typeof SaveBotHarnessSettingsRequestSchema
>;

/**
 * The General settings' run limits: model turns a task run and a chat reply
 * may take. Zero puts the code's default back.
 */
/**
 * A token figure on the run limits form: 0 puts the default back, anything
 * else must sit inside its range.
 */
const tokenLimit = ({ min, max, label }: { min: number; max: number; label: string }) =>
    z.coerce
        .number()
        .int()
        .refine((value) => value == 0 || (value >= min && value <= max), {
            message: `${label} must be 0 (the default) or between ${min.toLocaleString("en-US")} and ${max.toLocaleString("en-US")} tokens.`,
        });

export const SaveRunLimitsRequestSchema = z.object({
    task_steps: z.coerce.number().int().min(0).max(AppData.BotStepLimitMax),
    reply_steps: z.coerce.number().int().min(0).max(AppData.BotStepLimitMax),
    unattended_steps: z.coerce.number().int().min(0).max(AppData.BotStepLimitMax).default(0),
    run_tokens: tokenLimit({
        min: AppData.RunMaxPromptTokensMin,
        max: AppData.RunMaxPromptTokensMax,
        label: "Tokens per run",
    }).default(0),
    context_tokens: tokenLimit({
        min: AppData.HarnessContextBudgetMinTokens,
        max: AppData.HarnessContextBudgetMaxTokens,
        label: "Working context",
    }).default(0),
    /**
     * Seconds a failed model rests; 0 puts the default back.
     */
    model_rest_seconds: z.coerce
        .number()
        .int()
        .refine(
            (value) =>
                value == 0 ||
                (value >= AppData.HarnessModelRestMinSeconds && value <= AppData.HarnessModelRestMaxSeconds),
            {
                message: `Model rest must be 0 (the default) or between ${AppData.HarnessModelRestMinSeconds} and ${AppData.HarnessModelRestMaxSeconds} seconds.`,
            },
        )
        .default(0),
});

export type SaveRunLimitsRequest = z.infer<typeof SaveRunLimitsRequestSchema>;

export const PreviewVoiceRequestSchema = z.object({
    model_id: z.coerce.number().int().positive("Pick a speech model"),
    voice: z.string().trim().max(200).optional(),
});

export type PreviewVoiceRequest = z.infer<typeof PreviewVoiceRequestSchema>;
