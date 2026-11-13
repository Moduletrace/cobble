import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import grabComputerUsage, { type ComputerUsageFolder } from "@/src/functions/backend/computers/grab-computer-usage";
import grabComputerWorkspaceQuotaBytes from "@/src/functions/backend/db/app-settings/grab-computer-workspace-quota-bytes";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import formatBytes from "@/src/utils/format-bytes";
import computerWorkspaceSpace from "./computer-workspace-space";

type Params = {
    computer: ComputerApi;
    dirs: ComputerRunDirs;
    /**
     * How many bytes the call is about to add. A rewrite of an existing
     * file passes only the growth.
     */
    incoming_bytes: number;
    signal?: AbortSignal;
};

/**
 * Refuses a write that would push the computer's workspace past its limit
 * (`grabComputerWorkspaceQuotaBytes`), naming what is used and what to do
 * instead, so a bot clears space rather than retrying. The workspace is one
 * folder for every bot and user on that computer, mounted from the data
 * volume, so it is the one thing on a computer that can fill the host's
 * disk; everything else in the container goes with it.
 *
 * Returns the refusal's message, or null when the write fits. A computer
 * that won't report its usage is left to the write itself to refuse.
 */
type RoomParams = {
    used_bytes: number;
    quota_bytes: number;
    incoming_bytes: number;
};

/**
 * Whether a write of `incoming_bytes` fits: the one place the sum is made,
 * so the two write tools and the shell's warning agree. A quota of 0 means
 * the install sets no limit. A write that adds nothing (a rewrite the same
 * size, or a shrink) always fits, since refusing it would leave a bot over
 * the limit with no way back down.
 */
export function workspaceHasRoom({ used_bytes, quota_bytes, incoming_bytes }: RoomParams) {
    if (quota_bytes <= 0) return true;
    if (incoming_bytes <= 0) return true;

    return used_bytes + incoming_bytes <= quota_bytes;
}

export default async function computerWorkspaceRoomError({ computer, dirs, incoming_bytes, signal }: Params) {
    const quota_bytes = await grabComputerWorkspaceQuotaBytes();

    if (quota_bytes <= 0) return null;

    const usage = await grabComputerUsage({ computer, signal }).catch(() => null);

    if (!usage) return null;
    if (workspaceHasRoom({ used_bytes: usage.used_bytes, quota_bytes, incoming_bytes })) return null;

    return computerWorkspaceFullMessage({
        used_bytes: usage.used_bytes,
        quota_bytes,
        dirs,
        folders: usage.folders,
    });
}

/**
 * What a bot is told when the workspace is full: what is used, what the
 * limit is, where the space went (`computerWorkspaceSpace`), and what to do
 * instead. `dirs` is where its own work is, the one folder it may safely
 * clear.
 */
export function computerWorkspaceFullMessage({
    used_bytes,
    quota_bytes,
    dirs,
    folders,
}: {
    used_bytes: number;
    quota_bytes: number;
    dirs: ComputerRunDirs;
    folders?: ComputerUsageFolder[];
}) {
    const space = computerWorkspaceSpace({ folders, dirs });

    const advice = space && !space.clearable
        ? `Nothing was written. The room has to come back from that folder: name it in your report, with what you needed to write, so the user can clear it through Files or raise the limit. Anything you can delete in ${dirs.bot_dir ?? dirs.cwd} still helps, and importing what matters into your files and removing it here frees that much.`
        : `Nothing was written. Free space first with computer_bash: delete what you no longer need in ${dirs.bot_dir ?? dirs.cwd} (screenshots, downloads, old reports, raw dumps), or import what matters into your files and then remove it here.`;

    return [
        `No room left on this computer: its workspace holds ${formatBytes({ bytes: used_bytes })} of ${formatBytes({ bytes: quota_bytes })}.`,
        space?.description || "",
        advice,
    ]
        .filter(Boolean)
        .join(" ");
}

/**
 * The same, as a line added to a `computer_bash` result: that command can
 * write anything the agent never sees, so it is reported rather than
 * refused.
 */
export function computerWorkspaceFullNote({
    used_bytes,
    quota_bytes,
    dirs,
    folders,
}: {
    used_bytes: number;
    quota_bytes: number;
    dirs: ComputerRunDirs;
    folders?: ComputerUsageFolder[];
}) {
    const space = computerWorkspaceSpace({ folders, dirs });

    return `[This computer's workspace now holds ${formatBytes({ bytes: used_bytes })} of ${formatBytes({ bytes: quota_bytes })}${space ? `: ${space.description}` : ""} Writes through computer_write_file and computer_edit_file are refused until there is room. Free space in ${dirs.bot_dir ?? dirs.cwd} (screenshots, downloads, old reports, raw dumps), or import what matters into your files and remove it here.]`;
}

/**
 * Whether the workspace has passed its limit, and the message saying so, or
 * null while it has room or the install sets no limit.
 */
export async function computerWorkspaceFullWarning({ computer, dirs, signal }: Omit<Params, "incoming_bytes">) {
    const quota_bytes = await grabComputerWorkspaceQuotaBytes();

    if (quota_bytes <= 0) return null;

    const usage = await grabComputerUsage({ computer, signal }).catch(() => null);

    if (!usage) return null;
    if (workspaceHasRoom({ used_bytes: usage.used_bytes, quota_bytes, incoming_bytes: 0 })) return null;

    return computerWorkspaceFullNote({
        used_bytes: usage.used_bytes,
        quota_bytes,
        dirs,
        folders: usage.folders,
    });
}