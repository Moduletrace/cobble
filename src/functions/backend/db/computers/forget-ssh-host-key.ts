import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number;
};

/**
 * Clears the stored host key fingerprint for an SSH computer, prompting
 * trust-on-first-use verification on the next connection.
 */
export default async function forgetSshHostKey({ computer_id }: Params): Promise<void> {
    await BunSQLite.sql({
        sql: `UPDATE computers SET ssh_fingerprint = NULL WHERE id = ?`,
        values: [computer_id],
    });
}
