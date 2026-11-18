import type { HostDirectoryCheck } from "@/src/types";

type Params = {
    /**
     * A check row's `last_check` column.
     */
    text?: string | null;
};

/**
 * Reads a link's last check. Null when it has none, or when the column
 * doesn't hold one (a check is only ever written from a probe's answer, and
 * a check that can't be read is shown as none rather than trusted).
 */
export default function parseHostDirectoryCheck({ text }: Params): HostDirectoryCheck | null {
    if (!text) return null;

    try {
        const value = JSON.parse(text) as HostDirectoryCheck;

        if (!value || !Array.isArray(value.accounts)) return null;

        return {
            accounts: value.accounts.map((account) => ({
                bot_id: account.bot_id ?? null,
                name: String(account.name ?? ""),
                uid: Number(account.uid) || 0,
                readable: Boolean(account.readable),
                writable: Boolean(account.writable),
            })),
            computer_id:
                typeof value.computer_id == "number" && value.computer_id > 0
                    ? value.computer_id
                    : null,
            checked_at: Number(value.checked_at) || 0,
            error: typeof value.error == "string" ? value.error : null,
        };
    } catch {
        return null;
    }
}