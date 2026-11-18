import type { HostDirectoryCheck } from "@/src/types";

type Params = {
    /**
     * The last check of the folder on that computer.
     */
    check?: HostDirectoryCheck | null;
    /**
     * The uids of every bot that sees the folder there now.
     */
    uids?: number[];
};

/**
 * Whether the last check was made before a bot that sees the folder now was
 * there. Its account was never tested, so the folder's permissions may not
 * cover it, even though every account the check did test can write. A
 * folder that was never checked is not stale: it is simply unchecked.
 */
export default function hostDirectoryCheckStale({ check, uids = [] }: Params): boolean {
    if (!check) return false;

    const tested = new Set(check.accounts.map((account) => Number(account.uid)));

    return uids.some((uid) => !tested.has(Number(uid)));
}