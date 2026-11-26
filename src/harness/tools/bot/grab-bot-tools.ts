import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { HarnessTool } from "../../types";
import grabBotHookTools from "./hooks/grab-bot-hook-tools";
import grabBotTaskTools from "./tasks/grab-bot-task-tools";
import createScheduleTool from "./create-schedule-tool";
import deleteScheduleTool from "./delete-schedule-tool";
import listSchedulesTool from "./list-schedules-tool";
import setWorkspaceComputerTool from "./set-workspace-computer-tool";
import updateScheduleTool from "./update-schedule-tool";
import updateInstructionsTool from "./update-instructions-tool";
import updateMemoryTool from "./update-memory-tool";
import reactToMessageTool from "./react-to-message-tool";
import setPictureTool from "./set-picture-tool";
import askBotTool from "./ask-bot-tool";
import listAsksTool from "./list-asks-tool";
import readMessageUsageTool from "./settings/read-message-usage-tool";
import readSettingsTool from "./settings/read-settings-tool";
import grabCrewRole from "@/src/functions/backend/db/access/grab-crew-role";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the run is in: memory and instructions save there by
     * default, and the bot can switch its default computer.
     */
    workspace_id?: number | string | null;
    /**
     * The bot's computers where it runs, the current one first.
     */
    computers?: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The session being answered, so the bot can react to its messages.
     */
    session_id?: number | string;
    /**
     * Whether the run is the coordinator, which reaches every task and can
     * add to any bot's or workspace's list.
     */
    is_coordinator?: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
    /**
     * The files the run reaches (`grabRunScopes`), for the picture it may
     * set from one.
     */
    scopes?: StorageScope[];
    /**
     * The run is a hook call, so it gets no hook tools.
     */
    hooked?: boolean;
    /**
     * The run's own job, recorded on asks the bot makes so stopping exactly
     * that run ends exactly those requests.
     */
    job_id?: number | string | null;
    /**
     * A chat reply the user follows, which may delete tasks.
     */
    can_delete_tasks?: boolean;
    /**
     * In a chat reply: called with each hook proposal's ref, so the reply
     * carries its card. Without it the bot can't propose hooks.
     */
    onPropose?: (params: { ref: string }) => void;
    /**
     * Called with each tracker task the run worked on, so the message it
     * posts links to it (`bot_messages.task_ids`).
     */
    onTask?: (params: { task_id: number }) => void;
};

/**
 * The tools a bot works with on every run, bound to that bot and where it
 * works: its memory and instructions, its schedules, its hooks
 * (`grabBotHookTools`), for a worker ask_bot (another bot, through the
 * coordinator's gate), and in a workspace with several computers
 * switching the default one.
 */
export default async function grabBotTools({
    user_id,
    bot_id,
    workspace_id,
    computers = [],
    session_id,
    is_coordinator,
    admin_workspace_ids,
    scopes = [],
    hooked,
    job_id,
    can_delete_tasks,
    onPropose,
    onTask,
}: Params): Promise<HarnessTool[]> {
    const can_manage_crew = (await grabCrewRole({ user_id })) != "member";

    return [
        setPictureTool({ user_id, bot_id, scopes, is_coordinator }),
        readSettingsTool(),
        readMessageUsageTool({ session_id }),
        updateMemoryTool({ user_id, bot_id, workspace_id, can_manage_crew }),
        ...(can_manage_crew || workspace_id
            ? [updateInstructionsTool({ user_id, bot_id, workspace_id, can_manage_crew })]
            : []),
        /**
         * A hook call runs on someone else's words: its brief and payload are
         * fenced as data, so a payload that talks the model round must not be
         * able to leave a lasting mark on what the bot remembers, how it works
         * or when it runs. It reads, works and reports; those changes are made
         * in the conversation it reports into. A routine is the user's own
         * schedule, and a task run answers the user's own request, so both
         * keep them.
         */
        ...(hooked
            ? []
            : [
                  createScheduleTool({ user_id, bot_id, workspace_id, computers }),
                  updateScheduleTool({ user_id, bot_id, is_coordinator, workspace_id }),
                  deleteScheduleTool({ user_id, bot_id, is_coordinator, workspace_id }),
              ]),
        listSchedulesTool({ user_id, bot_id, is_coordinator, workspace_id }),
        ...grabBotHookTools({ user_id, bot_id, session_id, workspace_id, computers, hooked, is_coordinator, onPropose }),
        ...(session_id ? [reactToMessageTool({ bot_id, user_id, session_id })] : []),
        /**
         * A worker asks another bot only through the coordinator's gate,
         * never from a hook call's run, whose payload is someone else's
         * words.
         */
        ...(session_id && !is_coordinator && !hooked
            ? [
                  askBotTool({ user_id, bot_id, session_id, workspace_id, job_id }),
                  listAsksTool({ user_id, bot_id }),
              ]
            : []),
        ...(workspace_id && computers.length > 1
            ? [setWorkspaceComputerTool({ user_id, workspace_id, computers })]
            : []),
        ...(await grabBotTaskTools({
            user_id,
            bot_id,
            is_coordinator: Boolean(is_coordinator),
            admin_workspace_ids,
            workspace_id,
            can_delete: Boolean(can_delete_tasks) && !hooked,
            onTask,
        })),
    ];
}
