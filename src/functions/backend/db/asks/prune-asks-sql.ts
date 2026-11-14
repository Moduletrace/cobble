type Params = {
    cutoff: number;
    max_per_place: number;
    /**
     * One place only (a workspace's asks), or every place when left out.
     */
    workspace_id?: number | string | null;
};

/**
 * The ended asks to delete: older than the cutoff, or past the number one
 * place keeps, newest first. An ask a run is still waiting on is never
 * deleted (`parent_ask_id`), nor is one still pending or working.
 */
export default function pruneAsksSql({ cutoff, max_per_place, workspace_id }: Params) {
    return {
        sql: `SELECT id FROM (
                SELECT a.id, a.updated_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(a.workspace_id, 0)
                        ORDER BY a.updated_at DESC, a.id DESC
                    ) AS place_rank
                FROM bot_asks a
                WHERE a.status NOT IN ('pending', 'working')
                    ${workspace_id ? "AND a.workspace_id = ?" : ""}
                    AND a.id NOT IN (
                        SELECT parent_ask_id FROM bot_asks
                        WHERE parent_ask_id IS NOT NULL AND status IN ('pending', 'working')
                    )
            ) WHERE updated_at < ? OR place_rank > ?`,
        values: workspace_id
            ? [Number(workspace_id), cutoff, max_per_place]
            : [cutoff, max_per_place],
    };
}
