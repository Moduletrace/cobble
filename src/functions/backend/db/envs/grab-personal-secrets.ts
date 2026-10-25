import BunSQLite from "@moduletrace/bun-sqlite";
import type { PersonalSecret } from "@/src/types";

type Params = {
    /**
     * Only this user's. Left out lists everyone's, for the super admin's
     * Environment page.
     */
    user_id?: number | string;
};

/**
 * Personal secrets (envs with paradigm `user`) as settings pages list
 * them: key, description, bot and user, never the value.
 */
export default async function grabPersonalSecrets({ user_id }: Params = {}): Promise<PersonalSecret[]> {
    const res = await BunSQLite.sql<PersonalSecret>({
        sql: `SELECT e.id, e.key, e.description, e.bot_id, e.user_id, e.updated_at,
                COALESCE(b.name, 'Bot #' || e.bot_id) AS bot_name,
                COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.username, u.email, 'User #' || e.user_id) AS user_name
            FROM envs e
            LEFT JOIN bots b ON b.id = e.bot_id
            LEFT JOIN users u ON u.id = e.user_id
            WHERE e.paradigm = 'user' ${user_id ? "AND e.user_id = ?" : ""}
            ORDER BY bot_name COLLATE NOCASE ASC, e.key ASC`,
        values: user_id ? [Number(user_id)] : [],
    });

    return res.payload || [];
}
