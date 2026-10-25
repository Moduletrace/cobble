import { z } from "zod";
import { BotHookSignatureFormats, BotHookSources } from "@/src/dict/bot-hook-dict";

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
});

export type UpdateBotHookRequest = z.infer<typeof UpdateBotHookRequestSchema>;

export const BotHookIdRequestSchema = z.object({
    hook_id: HookIdField,
});

export type BotHookIdRequest = z.infer<typeof BotHookIdRequestSchema>;

/**
 * What a bot's hook proposal would save (`hook_proposals.data`): for a
 * new hook its name, brief, source and computers; for a change only what
 * changes. A bot never sets how calls are signed (the secret would pass
 * through it), and can only switch a hook back on (`enabled: true`):
 * pausing needs no proposal.
 */
export const HookProposalDataSchema = z.object({
    title: TitleField.optional(),
    instructions: InstructionsField.optional(),
    source: SourceField.optional(),
    computer_id: z.coerce.number().int().positive().nullable().optional(),
    watch_computer_id: z.coerce.number().int().positive().nullable().optional(),
    watch_filter: WatchFilterField.optional(),
    enabled: z.literal(true).optional(),
});

export type HookProposalData = z.infer<typeof HookProposalDataSchema>;

export const HookProposalIdRequestSchema = z.object({
    proposal_id: z.coerce.number().int().positive("Pick a proposal"),
});

export type HookProposalIdRequest = z.infer<typeof HookProposalIdRequestSchema>;
