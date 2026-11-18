import type { HostDirectoryAccess, HostDirectoryCheckState } from "@/src/dict/host-directory-dict";
import type { HostDirectoryCheck } from "@/src/types";
import hostDirectoryCheckState from "./host-directory-check-state";

type Params = {
    access: HostDirectoryAccess;
    /**
     * Its last check on each computer it is mounted on: a workspace link
     * has one per computer the workspace is on.
     */
    checks?: (HostDirectoryCheck | null | undefined)[];
};

/**
 * What a link is like for the bots: the worst its checks on its computers
 * found. A link nobody checked is unknown.
 */
export default function hostDirectoryLinkState({ access, checks = [] }: Params): HostDirectoryCheckState {
    const states = checks
        .filter((check): check is HostDirectoryCheck => Boolean(check))
        .map((check) => hostDirectoryCheckState({ check, access }));

    if (!states.length) return "unknown";
    if (states.includes("missing")) return "missing";
    if (states.includes("read-only")) return "read-only";
    if (states.includes("partial")) return "partial";
    if (states.includes("writable")) return "writable";

    return "unknown";
}