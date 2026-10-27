type Params = {
    /**
     * Closed rooms that last moved before this are deleted.
     */
    cutoff: number;
    /**
     * How many rooms one place keeps, open ones counted.
     */
    max_per_place: number;
    /**
     * Only this place: a workspace, or (null) bots' own chats. Left out,
     * every place.
     */
    workspace_id?: number | null;
};

/**
 * The ids of the rooms past retention: closed ones older than the cutoff,
 * and closed ones past the newest `max_per_place` rooms of their place
 * (ranked by last activity, open rooms counted but never picked). A room a
 * still-open room was asked from is kept, so a chain is never cut while it
 * runs.
 */
export default function pruneChatroomsSql({ cutoff, max_per_place, workspace_id }: Params) {
    const scoped = workspace_id !== undefined;

    return {
        sql: `SELECT id FROM (
                SELECT c.id, c.status,
                    COALESCE(c.closed_at, c.last_activity_at, c.created_at) AS moved_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(c.workspace_id, 0)
                        ORDER BY COALESCE(c.last_activity_at, c.created_at) DESC, c.id DESC
                    ) AS place_rank
                FROM chatrooms c
                ${scoped ? `WHERE c.workspace_id IS ?` : ""}
            ) ranked
            WHERE status != 'open'
                AND (moved_at < ? OR place_rank > ?)
                AND NOT EXISTS (SELECT 1 FROM chatrooms child WHERE child.parent_chatroom_id = ranked.id AND child.status = 'open')`,
        values: [...(scoped ? [workspace_id ? Number(workspace_id) : null] : []), cutoff, Math.max(1, max_per_place)] as (
            | string
            | number
        )[],
    };
}
