import { z } from "zod";

const Id = z.coerce.number().int().positive();
const Ids = z.array(Id).max(1000).default([]);

export const ConnectorIdSchema = z.object({
    connector_id: Id,
});

/**
 * Where a connector reaches: these workspaces, or every bot. Only a super
 * admin sets it.
 */
export const SaveConnectorAccessRequestSchema = z.object({
    connector_id: Id,
    workspace_ids: Ids,
    all_bots: z.boolean().optional(),
});

/**
 * Attaching a connector to one bot, as the user doing it: it shows in that
 * user's runs there and nobody else's.
 */
export const SetBotConnectorRequestSchema = z.object({
    bot_id: Id,
    connector_id: Id,
    attached: z.boolean().default(true),
});

export const StartConnectorConnectionRequestSchema = z.object({
    connector_id: Id,
    label: z.string().trim().max(80).default(""),
});

export const ConnectorRequestIdSchema = z.object({
    request_id: Id,
});

/**
 * What a person calls one of their sign-ins, so two accounts of the same app
 * stay apart in a conversation.
 */
export const SaveConnectorAccountRequestSchema = z.object({
    account_id: Id,
    label: z.string().trim().min(1, "Give the account a name.").max(80),
});

/**
 * Where one sign-in may be used: its owner's runs always, plus every run in
 * these workspaces or on these bots, or everywhere. The owner sets it, and a
 * super admin may set it on anyone's account.
 */
export const SaveConnectorAccountAccessRequestSchema = z.object({
    account_id: Id,
    workspace_ids: Ids,
    bot_ids: Ids,
    all_bots: z.boolean().default(false),
});

export const DisconnectConnectorAccountSchema = z.object({
    account_id: Id,
});

export type SaveConnectorAccessRequest = z.infer<typeof SaveConnectorAccessRequestSchema>;
export type SaveConnectorAccountRequest = z.infer<typeof SaveConnectorAccountRequestSchema>;
export const DetachConnectorFromBotSchema = z.object({
    bot_id: Id,
    connector_id: Id,
});

export type SaveConnectorAccountAccessRequest = z.infer<typeof SaveConnectorAccountAccessRequestSchema>;
export type StartConnectorConnectionRequest = z.infer<typeof StartConnectorConnectionRequestSchema>;