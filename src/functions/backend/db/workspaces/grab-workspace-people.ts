import BunSQLite from "@moduletrace/bun-sqlite";
import type { WorkspacePerson } from "@/src/types";
import workspacePeopleSql from "@/src/utils/crew-access/workspace-people-sql";

type Params = {
    workspace_id: number | string;
};

/**
 * Everyone who works in a workspace (`workspacePeopleSql`) with their role
 * there: super admins first, then admins, then members, each by name. For
 * crew managers' settings pages; the caller checks the actor is one.
 */
export default async function grabWorkspacePeople({ workspace_id }: Params): Promise<WorkspacePerson[]> {
    const people = workspacePeopleSql({ workspace_id, alias: "u" });

    const res = await BunSQLite.sql<WorkspacePerson>({
        sql: `SELECT
                u.id, u.first_name, u.last_name, u.email,
                (SELECT GROUP_CONCAT(DISTINCT user_type) FROM user_types WHERE user_id = u.id) AS user_types,
                (
                    SELECT m.id FROM media m
                    JOIN media_paradigms mp ON mp.media_id = m.id AND mp.media_paradigm = 'user-profile-image'
                    WHERE m.user_id = u.id AND m.is_primary = 1
                    ORDER BY m.id DESC LIMIT 1
                ) AS profile_media_id,
                r.role
            FROM users u
            LEFT JOIN workspace_user_roles r ON r.user_id = u.id AND r.workspace_id = ?
            WHERE COALESCE(u.archived, 0) <> 1 AND ${people.sql}
            ORDER BY
                EXISTS (SELECT 1 FROM user_types WHERE user_id = u.id AND user_type = 'super_admin') DESC,
                EXISTS (SELECT 1 FROM user_types WHERE user_id = u.id AND user_type = 'admin') DESC,
                LOWER(COALESCE(NULLIF(u.first_name, ''), u.email, '')),
                u.id`,
        values: [workspace_id, ...people.values],
    });

    return res.payload || [];
}
