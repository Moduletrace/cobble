/**
 * A folder on the host machine (Settings, under Host directories), mounted
 * into the computers linked to it, so bots reach the user's own files:
 * at `hosts/<slug>` in a bot's folder for a computer link, and at
 * `workspaces/<id>/<slug>` in the shared folder for a workspace link
 * (`hostDirectoryMountPlan`). A link is read and write unless it says read
 * only; a bot that must not change the user's files in place can clone
 * them into its own folder instead.
 *
 * The user sets the folder's permissions. The app only checks whether a
 * bot can write there (`probeHostDirectory`) and says what to run
 * (`hostDirectoryPermissionCommand`).
 */
export const HostDirectoryAccesses = [
    {
        title: "Read and write",
        value: "read-write",
    },
    {
        title: "Read only",
        value: "read-only",
    },
] as const;

export type HostDirectoryAccess = (typeof HostDirectoryAccesses)[number]["value"];

/**
 * What a check found for one computer: the folder is there and every bot
 * can write (`writable`), only some can (`partial`), it exists but no bot
 * can (`read-only`), it isn't there (`missing`), or nothing was checked
 * yet (`unknown`).
 */
export const HostDirectoryCheckStates = [
    {
        title: "Read and write",
        value: "writable",
    },
    {
        title: "Some bots can't write",
        value: "partial",
    },
    {
        title: "Read only",
        value: "read-only",
    },
    {
        title: "Missing",
        value: "missing",
    },
    {
        title: "Not checked",
        value: "unknown",
    },
] as const;

export type HostDirectoryCheckState = (typeof HostDirectoryCheckStates)[number]["value"];

/**
 * The folder a computer link is mounted at inside a bot's own folder
 * (`bots/<bot id>/hosts/<slug>`), so it works in every run of that bot
 * without the agent learning a new root.
 */
export const HostDirectoryMountFolder = "hosts";

export const HostDirectorySlugMaxChars = 32;
export const HostDirectorySourceMaxChars = 4096;
export const HostDirectoryNameMaxChars = 60;

/**
 * Where a mount's destination is prepared, as this app sees it, for a
 * computer: `DATA_DIR/computers/<id>/bots/<bot>/hosts/<slug>` and
 * `DATA_DIR/computers/<id>/workspaces/<id>/<slug>`.
 */
export const HostDirectoryCheckCacheMs = 30 * 1000;