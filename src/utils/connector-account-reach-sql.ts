type Params = {
    workspace_id?: number | string | null;
};

/**
 * The extra account clause a workspace brings: a connector given to a
 * workspace reaches everyone working in it, so every connected account of
 * that connector does too, whoever connected it. Empty outside a workspace,
 * and the global scope brings no accounts (only the workspace grant does).
 */
export default function connectorAccountReachSql({ workspace_id }: Params): { sql: string; values: number[] } {
    if (!workspace_id) return { sql: "", values: [] };

    return {
        sql: `OR EXISTS (SELECT 1 FROM workspace_connectors wc WHERE wc.connector_id = a.connector_id AND wc.workspace_id = ?)`,
        values: [Number(workspace_id)],
    };
}