import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
};

type UserNameRow = {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
};

/**
 * The user's name as the app shows it (first and last, else username), or
 * empty when they have neither. Every run's prompt gets it, so its bot knows
 * who it's working for instead of asking them to confirm it.
 */
export default async function grabUserName({ user_id }: Params): Promise<string> {
    const row = (
        await BunSQLite.sql<UserNameRow>({
            sql: `SELECT first_name, last_name, username FROM users WHERE id = ? LIMIT 1`,
            values: [user_id],
        })
    ).payload?.[0];

    return (
        [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() ||
        row?.username?.trim() ||
        ""
    );
}