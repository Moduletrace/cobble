import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
};

/**
 * Whether the user has added any browser of their own, so the composer
 * shows its Browser button only when there is one to pick.
 */
export default async function userHasBrowsers({ user_id }: Params) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM browsers WHERE user_id = ? LIMIT 1`,
        values: [Number(user_id)],
    });

    return Boolean(res.payload?.length);
}
