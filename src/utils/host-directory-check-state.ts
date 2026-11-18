import type {
    HostDirectoryAccess,
    HostDirectoryCheckState,
} from "@/src/dict/host-directory-dict";
import type { HostDirectoryCheck } from "@/src/types";

type Params = {
    check?: HostDirectoryCheck | null;
    /**
     * What the link is for: a read-only link only asks that the bots can
     * read the folder.
     */
    access: HostDirectoryAccess;
};

/**
 * What a check adds up to for a link: `writable` when every bot can write
 * there, `read-only` when they can read but not write (or a read-only link
 * only asks that), `partial` when only some can, `missing` when none can
 * open it, and `unknown` before any check ran or when there is no bot to
 * check it as.
 */
export default function hostDirectoryCheckState({
    check,
    access,
}: Params): HostDirectoryCheckState {
    const accounts = check?.accounts || [];

    if (!check || !accounts.length) return "unknown";

    const reachable = accounts.filter((account) => account.readable).length;

    if (!reachable) return "missing";
    if (reachable < accounts.length) return "partial";

    if (access == "read-only") return "read-only";

    const writable = accounts.filter((account) => account.writable).length;

    if (writable == accounts.length) return "writable";

    return writable ? "partial" : "read-only";
}