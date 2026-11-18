import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { BotHookEventStatuses, BotHookSignatureFormats, BotHookSources } from "@/src/dict/bot-hook-dict";

const HookIdField = z.coerce.number().int().positive("Pick a hook");
const TitleField = z.string().trim().min(1, "Give the hook a name").max(80, "Keep the name under 80 characters");
const InstructionsField = z.string().trim().min(1, "Tell the bot what to do with each call").max(8000);
const SignatureFormatField = z.enum(BotHookSignatureFormats.map((f) => f.value) as [string, ...string[]]);
/**
 * An HTTP header name (RFC 7230 token characters).
 */
const SignatureHeaderField = z
    .string()
    .trim()
    .max(100)
    .regex(/^[A-Za-z0-9!#$%&'*+.^_`|~-]*$/, "That isn't a header name");
const SourceField = z.enum(BotHookSources.map((s) => s.value) as [string, ...string[]]);
const WatchFilterField = z.string().trim().max(300, "Keep the filter under 300 characters");
const SigningSecretField = z.string().trim().min(8, "Use a secret of at least 8 characters").max(500);
/**
 * The command the app keeps running for a hook: a process that must stay
 * in the foreground (the thing that calls the hook, like a bridge), since
 * it is the one the check sees and starts again.
 */
const RunnerCommandField = z
    .string()
    .trim()
    .max(AppData.BotHookRunnerCommandMaxLength, "Keep the command under 2000 characters")
    .nullable()
    .optional();
const RunnerDirField = z
    .string()
    .trim()
    .max(AppData.BotHookRunnerDirMaxLength, "Keep the folder name under 300 characters")
    .refine((value) => !value || !value.startsWith("/"), "Give the folder inside the bot's folder, relative: for example \"whatsapp\"")
    .refine((value) => !value || !value.startsWith("~"), "The runner's folder has to be inside the bot's folder")
    .refine((value) => !value || !value.split("/").includes(".."), "The runner's folder has to stay inside the bot's folder")
    .optional();
const RunnerComputerField = z.coerce.number().int().positive().nullable().optional();

export const CreateBotHookRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
    workspace_id: z.coerce.number().int().positive().nullable().optional(),
    title: TitleField,
    instructions: InstructionsField,
    signing_secret: SigningSecretField.nullable().optional(),
    signature_header: SignatureHeaderField.optional(),
    signature_format: SignatureFormatField.optional(),
    source: SourceField.optional(),
    watch_computer_id: z.coerce.number().int().positive().nullable().optional(),
    watch_filter: WatchFilterField.nullable().optional(),
    /**
     * Its runs stay in its own thread instead of taking over the
     * conversation.
     */
    silent: z.boolean().optional(),
    /**
     * A process the app keeps running for it (a crew manager's, never a
     * bot's): see `syncHookRunners`.
     */
    runner_command: RunnerCommandField,
    runner_dir: RunnerDirField,
    runner_computer_id: RunnerComputerField,
});

export type CreateBotHookRequest = z.infer<typeof CreateBotHookRequestSchema>;

export const UpdateBotHookRequestSchema = z.object({
    hook_id: HookIdField,
    title: TitleField.optional(),
    instructions: InstructionsField.optional(),
    enabled: z.boolean().optional(),
    /**
     * `null` stops checking signatures.
     */
    signing_secret: SigningSecretField.nullable().optional(),
    signature_header: SignatureHeaderField.optional(),
    signature_format: SignatureFormatField.optional(),
    watch_filter: WatchFilterField.optional(),
    /**
     * Its runs stay in its own thread instead of taking over the
     * conversation.
     */
    silent: z.boolean().optional(),
    /**
     * Where it runs from now (same bot); `null` for the bot's own chat.
     */
    workspace_id: z.coerce.number().int().positive().nullable().optional(),
    /**
     * Its runner, as a crew manager sets it; `null` (or an empty command)
     * stops it.
     */
    runner_command: RunnerCommandField,
    runner_dir: RunnerDirField,
    runner_computer_id: RunnerComputerField,
});

export type UpdateBotHookRequest = z.infer<typeof UpdateBotHookRequestSchema>;

export const HookPlacesRequestSchema = z.object({
    bot_id: z.coerce.number().int().positive("Pick a bot"),
});

export type HookPlacesRequest = z.infer<typeof HookPlacesRequestSchema>;

export const BotHookIdRequestSchema = z.object({
    hook_id: HookIdField,
});

export type BotHookIdRequest = z.infer<typeof BotHookIdRequestSchema>;

/**
 * What a bot's hook proposal would save (`hook_proposals.data`): for a
 * new hook its name, brief, source and computers; for a change only what
 * changes. A bot never sets how calls are signed (the secret would pass
 * through it), and can only switch a hook back on (`enabled: true`):
 * pausing needs no proposal. A runner it proposes is a command the app
 * would start on the user's computer, so the card shows it word for word
 * and only a crew manager can confirm it.
 */
export const HookProposalDataSchema = z.object({
    title: TitleField.optional(),
    instructions: InstructionsField.optional(),
    source: SourceField.optional(),
    computer_id: z.coerce.number().int().positive().nullable().optional(),
    watch_computer_id: z.coerce.number().int().positive().nullable().optional(),
    watch_filter: WatchFilterField.optional(),
    enabled: z.literal(true).optional(),
    runner_command: RunnerCommandField,
    runner_dir: RunnerDirField,
    runner_computer_id: RunnerComputerField,
});

export type HookProposalData = z.infer<typeof HookProposalDataSchema>;

export const HookProposalIdRequestSchema = z.object({
    proposal_id: z.coerce.number().int().positive("Pick a proposal"),
});

export type HookProposalIdRequest = z.infer<typeof HookProposalIdRequestSchema>;

const HookCallStatusField = z.enum(BotHookEventStatuses.map((s) => s.value) as [string, ...string[]]);

/**
 * A search of the user's hook calls (`api/admin/hooks/hook-events`, and
 * the bots' `search_hook_calls`): one hook's or all, words found in what
 * a call sent or what its run answered, one status, older than a call.
 */
export const SearchHookCallsRequestSchema = z.object({
    hook_id: z.coerce.number().int().positive().optional(),
    q: z.string().trim().max(200, "Keep the search under 200 characters").optional(),
    status: HookCallStatusField.optional(),
    before_id: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const HookCallIdRequestSchema = z.object({
    event_id: z.coerce.number().int().positive("Pick a call"),
});

/**
 * How many days hook calls are kept (Settings > General). Zero puts the
 * code's default back.
 */
export const SaveHookCallRetentionRequestSchema = z.object({
    keep_days: z.coerce.number().int().min(0).max(AppData.BotHookEventsKeepDaysMax),
});
