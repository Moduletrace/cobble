type Row = {
    browser_id?: number | "" | null;
    bot_id?: number | "" | null;
    workspace_id?: number | "" | null;
    is_default?: number | "" | null;
};

type Params = {
    /**
     * The rows that apply to the run (`browserScopeSql`).
     */
    rows: Row[];
    /**
     * The browsers the run actually has: a default that's off or removed
     * falls through to the computer's.
     */
    usable_ids: number[];
};

function rank({ row }: { row: Row }) {
    if (row.workspace_id) return 3;
    if (row.bot_id) return 2;
    return 1;
}

/**
 * The run's default browser, null for the computer's: the workspace's row,
 * then the bot's, then the user's all-bots row.
 */
export default function pickDefaultBrowser({ rows, usable_ids }: Params): number | null {
    const chosen = rows.filter((row) => row.is_default).sort((a, b) => rank({ row: b }) - rank({ row: a }))[0];

    if (!chosen?.browser_id) return null;

    return usable_ids.includes(chosen.browser_id) ? chosen.browser_id : null;
}
