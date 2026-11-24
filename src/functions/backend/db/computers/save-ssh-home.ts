import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number;
    home: string;
};

/**
 * Persists the remote user's home directory path for an SSH computer.
 */
export default async function saveSshHome({ computer_id, home }: Params): Promise<void> {
    await BunSQLite.sql({
        sql: `UPDATE computers SET ssh_home = ? WHERE id = ?`,
        values: [home, computer_id],
    });
}
