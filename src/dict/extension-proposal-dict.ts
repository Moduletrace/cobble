/**
 * Where an MCP server, tool or skill the coordinator proposed stands
 * (`extension_proposals.status`): `pending` until the super admin
 * confirms (`confirmed`, saved) or rejects it, `replaced` when the bot
 * proposed it again, `failed` when confirming couldn't save it. A pending
 * one past its `expires_at` reads as expired.
 */
export const ExtensionProposalStatuses = ["pending", "confirmed", "rejected", "replaced", "failed"] as const;

export type ExtensionProposalStatus = (typeof ExtensionProposalStatuses)[number];

/**
 * What a proposal adds or changes.
 */
export const ExtensionProposalKinds = [
    { value: "mcp", title: "MCP server" },
    { value: "tool", title: "tool" },
    { value: "skill", title: "skill" },
] as const;

export type ExtensionProposalKind = (typeof ExtensionProposalKinds)[number]["value"];
