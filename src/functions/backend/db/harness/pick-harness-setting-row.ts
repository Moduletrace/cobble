/**
 * Whose saved setting a harness call uses: a worker bot's own wins, then
 * the models of the workspace it works in, then the install defaults.
 */
export type HarnessSettingSource = "bot" | "workspace" | "default";

type Params<Row> = {
    /**
     * The bot's own row (`bot_harness_settings`), when the call names a
     * worker bot.
     */
    bot_row?: Row;
    /**
     * The workspace's row (`workspace_harness_settings`), when the call is
     * in a workspace.
     */
    workspace_row?: Row;
    /**
     * The install's row (`harness_settings`), when it has one.
     */
    default_row?: Row;
};

/**
 * The row a call runs on and where it came from. A bot's own pick wins
 * over its workspace's for every run in that workspace, so setting one
 * bot's model there never changes another's.
 */
export default function pickHarnessSettingRow<Row>({
    bot_row,
    workspace_row,
    default_row,
}: Params<Row>): { row?: Row; source: HarnessSettingSource } {
    if (bot_row) return { row: bot_row, source: "bot" };
    if (workspace_row) return { row: workspace_row, source: "workspace" };
    if (default_row) return { row: default_row, source: "default" };

    return { row: undefined, source: "default" };
}