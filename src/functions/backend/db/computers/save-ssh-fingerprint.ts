import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number;
    fingerprint: string;
};

/**
 * Persists the learned SHA256 host key fingerprint for an SSH computer
 * on trust-on-first-use.
 */
export default async function saveSshFingerprint({ computer_id, fingerprint }: Params): Promise<void> {
    await BunSQLite.sql({
        sql: `UPDATE computers SET ssh_fingerprint = ? WHERE id = ?`,
        values: [fingerprint, computer_id],
    });
}
