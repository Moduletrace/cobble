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
export const SaveRunLimitsRequestSchema = z.object({
    task_steps: z.coerce.number().int().min(0).max(AppData.BotStepLimitMax),
    reply_steps: z.coerce.number().int().min(0).max(AppData.BotStepLimitMax),
});

export type SaveRunLimitsRequest = z.infer<typeof SaveRunLimitsRequestSchema>;

export const PreviewVoiceRequestSchema = z.object({
    model_id: z.coerce.number().int().positive("Pick a speech model"),
    voice: z.string().trim().max(200).optional(),
});

export type PreviewVoiceRequest = z.infer<typeof PreviewVoiceRequestSchema>;
