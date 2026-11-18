import { AppData } from "@/src/data/app-data";

type Params = {
    bot_id: number | string;
    /**
     * `worker` or `coordinator` (`bots.kind`): the coordinator works as
     * the computer's own user, a worker as its own account.
     */
    bot_kind: string;
    /**
     * The workspaces the bot works in on that computer, when it works in
     * any: their bots share a group (`cw-<workspace id>`) a host directory
     * mounted for a workspace is given to.
     */
    workspace_ids?: (number | string)[];
};

/**
 * The account a bot works as on a computer, as the computer's agent makes
 * it (`computer/agent/run-user-for.ts`, `computer/agent/config.ts`; keep
 * all three alike): the coordinator is `gem`, uid and gid
 * `AppData.ComputerUserUid`, and a worker `cb-<bot id>`, uid and gid
 * `AppData.ComputerWorkerIdBase + bot id`. In a workspace every bot is in
 * that workspace's group, gid `AppData.ComputerWorkspaceGroupIdBase +
 * workspace id`. A host directory's permission command is written for
 * these ids, since the user gives the folder to them.
 */
export default function hostDirectoryAccount({ bot_id, bot_kind, workspace_ids = [] }: Params) {
    const is_coordinator = bot_kind == "coordinator";
    const uid = is_coordinator
        ? AppData.ComputerUserUid
        : AppData.ComputerWorkerIdBase + Number(bot_id);
    const gid = is_coordinator ? AppData.ComputerUserGid : uid;
    /**
     * The coordinator works as the computer's own user and is in no
     * workspace's group (`gem` reaches the workspace as root), so its
     * probe must not be given one either.
     */
    const group_ids = is_coordinator
        ? []
        : workspace_ids.map((workspace_id) => AppData.ComputerWorkspaceGroupIdBase + Number(workspace_id));

    return { uid, gid, group_ids };
}