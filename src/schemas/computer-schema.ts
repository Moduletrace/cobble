import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { ComputerBlockedBrowserArgs, ComputerBlockedMcpArgs, ComputerBrowserScales, ComputerScreenSizes } from "@/src/dict/computer-dict";
import blockedComputerArgs from "@/src/utils/blocked-computer-args";
import isTimeZone from "@/src/utils/is-time-zone";

const ComputerCpusSchema = z.coerce
    .number()
    .min(AppData.ComputerMinCpus, `Give it at least ${AppData.ComputerMinCpus} CPU`)
    .max(AppData.ComputerMaxCpus, `Keep it under ${AppData.ComputerMaxCpus} CPUs`);

const ComputerMemoryMbSchema = z.coerce
    .number()
    .int()
    .min(AppData.ComputerMinMemoryMb, `Give it at least ${AppData.ComputerMinMemoryMb} MB of memory`);

const ComputerNameSchema = z.string().trim().min(1, "Give the computer a name").max(60, "Keep the name under 60 characters");
const ComputerDescriptionSchema = z.string().trim().max(240, "Keep the description short");

export const CreateComputerRequestSchema = z.object({
    name: ComputerNameSchema,
    description: ComputerDescriptionSchema.default(""),
    /**
     * Defaults to `AppData.ComputerDefaultCpus` / `ComputerDefaultMemoryMb`.
     */
    cpus: ComputerCpusSchema.optional(),
    memory_mb: ComputerMemoryMbSchema.optional(),
    /**
     * Also link it to this workspace.
     */
    workspace_id: z.coerce.number().int().positive().nullish(),
});

export type CreateComputerRequest = z.infer<typeof CreateComputerRequestSchema>;

export const ComputerIdRequestSchema = z.object({
    computer_id: z.coerce.number().int().positive("Pick a computer"),
});

export type ComputerIdRequest = z.infer<typeof ComputerIdRequestSchema>;

/**
 * A text setting left empty uses the default.
 */
const optionalText = (schema: z.ZodString) =>
    z.preprocess((value) => (typeof value == "string" && !value.trim() ? undefined : value), schema.optional());

const extraArgs = ({ blocked, what }: { blocked: readonly string[]; what: string }) =>
    optionalText(
        z
            .string()
            .trim()
            .max(2000, "Keep the flags under 2000 characters")
            .refine((text) => !/["'`\\]/.test(text), "Flags are split on spaces: leave out quotes and backslashes")
            .superRefine((text, ctx) => {
                const found = blockedComputerArgs({ text, blocked });

                if (found.length) {
                    ctx.addIssue({ code: "custom", message: `${what} can't take ${found.join(", ")}: the computer sets those itself.` });
                }
            }),
    );

/**
 * A computer's browser (`computers.browser_settings`, its container's env
 * through `computerBrowserEnv`). Anything left out uses the default: the
 * app's timezone, en-US, 1920x1080, Chrome's sandbox on, no extra flags.
 * Keep the timezone and languages matched to where its traffic comes from.
 */
export const ComputerBrowserSettingsSchema = z.object({
    timezone: optionalText(
        z
            .string()
            .trim()
            .max(64)
            .refine((zone) => isTimeZone({ zone }), "Pick a timezone like Africa/Lagos or UTC"),
    ),
    language: optionalText(
        z
            .string()
            .trim()
            .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a language tag like en-US"),
    ),
    accept_languages: optionalText(
        z
            .string()
            .trim()
            .max(200)
            .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*(\s*,\s*[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*)*$/, "Use language tags separated by commas, like en-US,en"),
    ),
    screen: z.enum(ComputerScreenSizes).optional(),
    scale: z.enum(ComputerBrowserScales).optional(),
    sandbox: z.boolean().optional(),
    browser_args: extraArgs({ blocked: ComputerBlockedBrowserArgs, what: "Chrome" }),
    mcp_args: extraArgs({ blocked: ComputerBlockedMcpArgs, what: "Playwright MCP" }),
});

export type ComputerBrowserSettings = z.infer<typeof ComputerBrowserSettingsSchema>;

export const UpdateComputerRequestSchema = ComputerIdRequestSchema.extend({
    browser_settings: ComputerBrowserSettingsSchema.optional(),
    name: ComputerNameSchema.optional(),
    description: ComputerDescriptionSchema.optional(),
    cpus: ComputerCpusSchema.optional(),
    memory_mb: ComputerMemoryMbSchema.optional(),
});

export type UpdateComputerRequest = z.infer<typeof UpdateComputerRequestSchema>;
