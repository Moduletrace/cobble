import path from "node:path";
import { AppData } from "@/src/data/app-data";
import {
    type HostDirectoryAccess,
    HostDirectoryMountFolder,
} from "@/src/dict/host-directory-dict";

export type HostDirectoryMount = {
    host_directory_id: number;
    source: string;
    slug: string;
    access: HostDirectoryAccess;
    /**
     * Whether it was linked to the computer itself or to a workspace on it.
     */
    scope: "computer" | "workspace";
    /**
     * The bot whose folder it is mounted in, for a computer link.
     */
    bot_id?: number;
    workspace_id?: number;
    /**
     * The folder the mount point is prepared at, as this app sees it
     * (`DATA_DIR/computers/<id>/...`): inside the bot's folder or the
     * workspace's.
     */
    destination: string;
    /**
     * Where it is inside the container: `hosts/<slug>` in a bot's folder,
     * `<slug>` in the workspace's shared one. Both are inside a run's
     * roots, so the agent's path checks let the bot work there.
     */
    target: string;
};

export type HostDirectoryMountSkip = {
    host_directory_id: number;
    source: string;
    /**
     * Why it wasn't mounted, in the user's words.
     */
    reason: string;
};

type Link = {
    host_directory_id: number;
    slug: string;
    source: string;
    access: HostDirectoryAccess;
};

type Params = {
    /**
     * The computer's folder on the data volume (`grabComputerDataDir`).
     */
    computer_dir: string;
    computer_links: Link[];
    workspace_links: (Link & { workspace_id: number })[];
    /**
     * The bots that reach the computer: the coordinator, the ones granted
     * it, and the ones in the workspaces joined to it.
     */
    bots: { id: number; kind: string }[];
    /**
     * Host directories whose last check found the folder missing: not
     * mounted, so docker never makes the folder itself.
     */
    missing?: number[];
};

/**
 * Where each host directory linked to a computer is mounted: a computer
 * link in every bot's own folder (`bots/<bot>/hosts/<slug>`), so a run of
 * that bot works in it wherever it runs; a workspace link in the
 * workspace's shared folder (`workspaces/<id>/<slug>`), which every bot
 * there already reaches. Both stay inside the run's roots, so no agent
 * change is needed for a bot to work in them.
 *
 * A source the last check found missing is skipped, never mounted: docker
 * would otherwise make it, as root, on the host.
 */
export default function hostDirectoryMountPlan({
    computer_dir,
    computer_links,
    workspace_links,
    bots,
    missing = [],
}: Params) {
    const mounts: HostDirectoryMount[] = [];
    const skipped: HostDirectoryMountSkip[] = [];
    const workspace = AppData.ComputerWorkspaceDir;

    for (const link of computer_links) {
        if (missing.includes(link.host_directory_id)) {
            skipped.push({
                host_directory_id: link.host_directory_id,
                source: link.source,
                reason: "The folder isn't there, or the bots can't reach it.",
            });

            continue;
        }

        for (const bot of bots) {
            mounts.push({
                host_directory_id: link.host_directory_id,
                source: link.source,
                slug: link.slug,
                access: link.access,
                scope: "computer",
                bot_id: bot.id,
                destination: path.join(
                    computer_dir,
                    "bots",
                    String(bot.id),
                    HostDirectoryMountFolder,
                    link.slug
                ),
                target: `${workspace}/bots/${bot.id}/${HostDirectoryMountFolder}/${link.slug}`,
            });
        }
    }

    for (const link of workspace_links) {
        if (missing.includes(link.host_directory_id)) {
            skipped.push({
                host_directory_id: link.host_directory_id,
                source: link.source,
                reason: "The folder isn't there, or the bots can't reach it.",
            });

            continue;
        }

        mounts.push({
            host_directory_id: link.host_directory_id,
            source: link.source,
            slug: link.slug,
            access: link.access,
            scope: "workspace",
            workspace_id: link.workspace_id,
            destination: path.join(
                computer_dir,
                "workspaces",
                String(link.workspace_id),
                link.slug
            ),
            target: `${workspace}/workspaces/${link.workspace_id}/${link.slug}`,
        });
    }

    return { mounts, skipped };
}