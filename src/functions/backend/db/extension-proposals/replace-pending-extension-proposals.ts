import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /** The proposal just stored, or just confirmed. */
    proposal_id: number | string;
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    kind: "mcp" | "tool" | "skill";
    /**
     * A skill's slug: it names the one skill a proposal is about, including
     * one that doesn't exist yet, and is what makes two of them the same.
     */
    slug?: string | null;
    /**
     * The extension a proposal changes; a new one has none.
     */
    extension_id?: number | string | null;
    name: string;
    /**
     * What the replaced card says, when it wasn't a newer proposal that
     * took its place.
     */
    reason?: string;
};

/**
 * Marks every pending proposal for the same thing replaced, in the same
 * conversation: only the latest card can be confirmed, and an older one
 * left pending is a card the user can still press whose outcome is already
 * written. Scoped by user, bot and workspace rather than by session, since
 * a conversation that carries on into a new session keeps proposing into
 * it: proposal #41 (Co-Marketing, session 145) was made again 36 seconds
 * later in session 146 and confirmed there, and #41 stayed pending for
 * ever. For a skill the slug decides it (RevOps was proposed four times
 * under two names, all slug `revops`); for a server or tool it is the
 * extension itself, else the name.
 */
export default async function replacePendingExtensionProposals({
    proposal_id,
    user_id,
    bot_id,
    workspace_id,
    kind,
    slug,
    extension_id,
    name,
    reason,
}: Params) {
    const { sql, values } = replacePendingExtensionProposalsSql({
        proposal_id,
        user_id,
        bot_id,
        workspace_id,
        kind,
        slug,
        extension_id,
        name,
        reason,
    });

    await BunSQLite.sql({ sql, values });
}

/**
 * The statement itself, so the conditions are checked against real SQLite
 * (`replace-pending-extension-proposals.test.ts`): a wrong one either
 * leaves a card the user can still press or replaces a different skill's.
 */
export function replacePendingExtensionProposalsSql({
    proposal_id,
    user_id,
    bot_id,
    workspace_id,
    kind,
    slug,
    extension_id,
    name,
    reason,
}: Params) {
    const now = Date.now();
    const target = targetSql({ slug, extension_id, name });

    return {
        sql: `UPDATE extension_proposals SET status = 'replaced', outcome = ?, decided_at = ?, updated_at = ?
            WHERE user_id = ? AND bot_id = ? AND COALESCE(workspace_id, 0) = ? AND kind = ?
            AND status = 'pending' AND id != ?
            AND ${target.sql}`,
        values: [
            reason || `Replaced by proposal #${proposal_id}.`,
            now,
            now,
            Number(user_id),
            Number(bot_id),
            Number(workspace_id) || 0,
            kind,
            Number(proposal_id),
            target.value,
        ],
    };
}

/**
 * What makes two proposals about the same thing: a skill's slug, the
 * extension being changed, or a new one's name compared with spaces,
 * hyphens and underscores taken out ("Rev Ops" and "rev-ops" are one name).
 */
function targetSql({ slug, extension_id, name }: { slug?: string | null; extension_id?: number | string | null; name: string }) {
    const skill_slug = slug?.trim().toLowerCase() || "";

    if (skill_slug) return { sql: "lower(json_extract(data, '$.slug')) = ?", value: skill_slug };

    if (extension_id) return { sql: "extension_id = ?", value: Number(extension_id) };

    return {
        sql: "extension_id IS NULL AND lower(replace(replace(replace(trim(name), ' ', ''), '-', ''), '_', '')) = ?",
        value: name
            .trim()
            .toLowerCase()
            .replace(/[ _-]+/g, ""),
    };
}