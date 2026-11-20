import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /** The proposal just stored, or just confirmed. */
    proposal_id: number | string;
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The hook it changes; none for a new one.
     */
    hook_id?: number | string | null;
    title: string;
    /**
     * What the replaced card says, when it wasn't a newer proposal that
     * took its place.
     */
    reason?: string;
};

/**
 * Marks every pending hook proposal for the same hook, or the same new
 * name, replaced: only the latest card can be confirmed. Scoped by user,
 * bot and workspace rather than by session, the same way an extension
 * proposal is (`replacePendingExtensionProposals`), since a conversation
 * carried into a new session keeps proposing into it.
 */
export default async function replacePendingHookProposals({
    proposal_id,
    user_id,
    bot_id,
    workspace_id,
    hook_id,
    title,
    reason,
}: Params) {
    await BunSQLite.sql(
        replacePendingHookProposalsSql({ proposal_id, user_id, bot_id, workspace_id, hook_id, title, reason }),
    );
}

/**
 * The statement itself, checked against real SQLite
 * (`replace-pending-hook-proposals.test.ts`).
 */
export function replacePendingHookProposalsSql({
    proposal_id,
    user_id,
    bot_id,
    workspace_id,
    hook_id,
    title,
    reason,
}: Params) {
    const now = Date.now();
    const changed = Boolean(Number(hook_id));

    return {
        sql: `UPDATE hook_proposals SET status = 'replaced', outcome = ?, decided_at = ?, updated_at = ?
            WHERE user_id = ? AND bot_id = ? AND COALESCE(workspace_id, 0) = ?
            AND status = 'pending' AND id != ?
            AND (${changed ? "hook_id = ?" : "hook_id IS NULL AND lower(replace(replace(replace(trim(title), ' ', ''), '-', ''), '_', '')) = ?"})`,
        values: [
            reason || `Replaced by proposal #${proposal_id}.`,
            now,
            now,
            Number(user_id),
            Number(bot_id),
            Number(workspace_id) || 0,
            Number(proposal_id),
            changed
                ? Number(hook_id)
                : title
                      .trim()
                      .toLowerCase()
                      .replace(/[ _-]+/g, ""),
        ],
    };
}