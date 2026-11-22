type Params = {
    bot_id: number | string;
    /**
     * The user the run is for: a bot-level attachment only reaches theirs.
     */
    user_id: number | string;
    /**
     * The workspace the run is in: what's attached to it reaches every run
     * there, whoever runs it.
     */
    workspace_id?: number | string | null;
};

/**
 * The enabled connectors one run reaches: every global one (a super
 * admin's `all_bots`), the workspace's, the ones this user attached to
 * this bot, and any whose connected account was given to this bot or
 * workspace (or to every bot), since an account given out is a grant to
 * use the app there. A bot-level row is always personal, so another
 * user's attachment never shows here, even on the same bot.
 */
export default function botConnectorsSql({ bot_id, user_id, workspace_id }: Params) {
    const shared_account_sql = `OR x.id IN (
                SELECT a.connector_id FROM connector_accounts a WHERE a.status = 'connected' AND (
                    a.all_bots = 1
                    OR EXISTS (SELECT 1 FROM connector_account_bots ab WHERE ab.account_id = a.id AND ab.bot_id = ?)
                    ${workspace_id ? `OR EXISTS (SELECT 1 FROM connector_account_workspaces aw WHERE aw.account_id = a.id AND aw.workspace_id = ?)` : ""}
                )
            )`;

    return {
        sql: `SELECT x.* FROM connectors x WHERE x.enabled = 1 AND (
            x.all_bots = 1
            ${workspace_id ? `OR x.id IN (SELECT connector_id FROM workspace_connectors WHERE workspace_id = ?)` : ""}
            OR x.id IN (SELECT connector_id FROM bot_connectors WHERE bot_id = ? AND user_id = ?)
            ${shared_account_sql}
        ) ORDER BY x.id ASC`,
        values: workspace_id
            ? [Number(workspace_id), Number(bot_id), Number(user_id), Number(bot_id), Number(workspace_id)]
            : [Number(bot_id), Number(user_id), Number(bot_id)],
    };
}