/**
 * The workspace's saved setting for a harness, unless the call is for the
 * coordinator: the coordinator always uses the install defaults, so a
 * workspace's row never applies to it (L4). With no bot named the row
 * still applies, as before.
 */
export default function workspaceHarnessSettingSql({
    workspace_id,
    harness,
    bot_id,
}: {
    workspace_id: number | string;
    harness: string;
    bot_id?: number | string | null;
}): { sql: string; values: (number | string | null)[] } {
    return {
        sql: `SELECT * FROM workspace_harness_settings WHERE workspace_id = ? AND harness = ?
            AND NOT EXISTS (SELECT 1 FROM bots b WHERE b.id = ? AND b.kind = 'coordinator')
            LIMIT 1`,
        values: [workspace_id, harness, bot_id ?? null],
    };
}