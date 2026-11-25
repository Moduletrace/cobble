import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../types";
import askToTakeOverTool from "../computer/ask-to-take-over-tool";
import importFileTool from "../computer/import-file-tool";
import searchComputersTool from "../computer/search-computers-tool";
import addBotToWorkspaceTool from "./add-bot-to-workspace-tool";
import assignComputerTool from "./assign-computer-tool";
import createBotTool from "./create-bot-tool";
import createWorkspaceTool from "./create-workspace-tool";
import delegateTaskTool from "./delegate-task-tool";
import handOverScheduleTool from "./hand-over-schedule-tool";
import deleteBotTool from "./delete-bot-tool";
import deleteWorkspaceTool from "./delete-workspace-tool";
import findBotTool from "./find-bot-tool";
import findWorkspaceTool from "./find-workspace-tool";
import listWorkspaceBotsTool from "./list-workspace-bots-tool";
import grabCoordinatorExtensionTools from "./extensions/grab-coordinator-extension-tools";
import grabCoordinatorKnowledgebaseTools from "./knowledgebases/grab-coordinator-knowledgebase-tools";
import grabBotTools from "./grab-bot-tools";
import removeBotFromWorkspaceTool from "./remove-bot-from-workspace-tool";
import updateBotTool from "./update-bot-tool";
import updateWorkspaceTool from "./update-workspace-tool";
import listWorkspacePeopleTool from "./list-workspace-people-tool";
import setUserWorkspaceRoleTool from "./set-user-workspace-role-tool";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import askableBots from "@/src/functions/backend/db/asks/askable-bots";
import handOverTaskTool from "./hand-over-task-tool";
import setWorkspaceInstructionsTool from "./set-workspace-instructions-tool";
import sendReplyTool from "./send-reply-tool";
import computerRunDirs from "@/src/utils/computer-work-dirs";
import type { BotRunPowers } from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import grabWorkspaceAdminTools, { type WorkspaceAdminTools } from "./grab-workspace-admin-tools";
import setBotTypeTool from "./set-bot-type-tool";
import type { BrowserRunKind } from "@/src/dict/browser-dict";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    /**
     * What the bot's types let it do on this run (`grabBotRunPowers`).
     */
    powers: BotRunPowers;
    user_id: number | string;
    /**
     * The bot's computers where it runs, the current one first
     * (`grabBotComputers`).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The session being answered; tasks report back to it.
     */
    session_id: number | string;
    /**
     * The session's workspace, if any.
     */
    workspace_id?: number | string | null;
    /**
     * The user message being answered.
     */
    message_id?: number | string;
    /**
     * The job this run is carrying out, so `send_reply` doesn't count its
     * own open job as work that is still running.
     */
    job_id?: number | string;
    /**
     * Called with the run `send_reply` queued, so the reply can cancel it
     * if the review refuses the message that announced it.
     */
    onQueue?: (params: { job_id: number }) => void;
    /**
     * The files the run reaches (`grabRunScopes`), so a picture it sets is
     * copied from one it can already read.
     */
    scopes?: StorageScope[];
    /**
     * The user follows the conversation (not a hidden session):
     * only then may the reply delete tasks.
     */
    attended?: boolean;
    /**
     * The run's browser kind, propagated to `send_reply`'s work children (H7) so a
     * hidden session's reply never lets a child reach the user's browsers.
     */
    run_kind?: BrowserRunKind;
    /**
     * Called when the bot asks the user to take over a computer.
     */
    onTakeOver?: (params: { ref: string }) => void;
    /**
     * Called when the bot proposes a hook, or the coordinator an MCP
     * server, tool or skill, for the user to confirm.
     */
    onPropose?: (params: { ref: string }) => void;
    /**
     * Called with what a workspace admin leads, when the run is one, so
     * the reply can say so in its prompt.
     */
    onWorkspaceAdmin?: (params: WorkspaceAdminTools) => void;
    /**
     * Called with each tracker task the run worked on, so the message it
     * posts links to it (`bot_messages.task_ids`).
     */
    onTask?: (params: { task_id: number }) => void;
    /**
     * Called with a file the reply sent, so the message carries it.
     */
    onAttach?: (params: { media_id: number; name: string }) => void;
    /**
     * Plan mode: the reply plans and reads, and starts nothing. `send_reply`
     * refuses work, and `run-bot-reply` gates the tools to the allowlist.
     */
    plan_mode?: boolean;
    /**
     * The plan whose step this reply works: the work its `send_reply` queues
     * carries the plan, so that run's report ends on the card that moves the
     * plan on.
     */
    plan_id?: number | null;
};

/**
 * The tools a bot replies in chat with: its own (memory, instructions, and
 * in a workspace switching its default computer), send_reply for the message
 * and the longer work it queues, search_computers to find what's on its
 * computers, import_file to keep a file one of them made (an image, a PDF,
 * an export) in its own files, ask_user_to_take_over when only the user can
 * do something on one, and
 * for the coordinator (the super admin's alone) create_workspace and
 * update_workspace (a workspace and its shared context, which
 * find_workspace reads back wherever the coordinator works), create_bot to
 * grow the crew, delegate_task to every worker (the workspace's in a
 * workspace, where the task runs; from its own chat, in the worker's own
 * chat or in a workspace it names) and hand_over_schedule beside it, plus, in its own chat, find_bot,
 * list_workspace_bots,
 * add_bot_to_workspace and remove_bot_from_workspace, assign_computer,
 * update_bot, delete_bot and delete_workspace (which workspace, which
 * computers, and which name, role and core instructions each crew member
 * gets, and what goes) and the install's skills, MCP servers and custom
 * tools (`grabCoordinatorExtensionTools`, in a workspace as much as in its
 * own chat: a runbook for the crew there is written from either) or, in a
 * workspace, set_bot_workspace_instructions and update_bot for the
 * workspace's crew (a bot's core prompt is asked for from wherever the
 * user is), plus set_bot_type to make a worker a workspace's admin. A
 * workspace admin, in the workspace it leads, gets
 * `grabWorkspaceAdminTools`. A worker gets no work to hand out, but it may
 * pass on a task of its own to a bot it could ask (`hand_over_task`). Every
 * gate reads the bot's types (`powers`), never `bots.kind`. Longer work on
 * a computer, and anything that changes it, still goes through a task,
 * never mid-reply.
 */
export default async function grabBotChatTools({
    bot,
    powers,
    user_id,
    computers,
    session_id,
    workspace_id,
    message_id,
    job_id,
    onQueue,
    scopes = [],
    attended,
    run_kind,
    onTakeOver,
    onPropose,
    onWorkspaceAdmin,
    onTask,
    onAttach,
    plan_mode,
    plan_id,
}: Params): Promise<HarnessTool[]> {
    const bot_id = bot.id || 0;
    const dirs = computerRunDirs({ bot_id, bot_kind: bot.kind, user_id, workspace_id });
    const tools = [
        ...(await grabBotTools({
            user_id,
            bot_id,
            workspace_id,
            computers,
            session_id,
            is_coordinator: powers.is_coordinator,
            admin_workspace_ids: powers.admin_workspace_ids,
            scopes,
            can_delete_tasks: Boolean(attended),
            onPropose,
            onTask,
        })),
        sendReplyTool({
            user_id,
            bot_id,
            session_id,
            computers,
            message_id,
            job_id,
            run_kind,
            onQueue,
            plan_mode,
            plan_id,
        }),
        ...(computers.length
            ? [
                  searchComputersTool({
                      bot_id,
                      user_id,
                      computers,
                      workspace_id,
                      dirs,
                  }),
                  importFileTool({
                      computers,
                      scopes,
                      bot_id,
                      user_id,
                      dirs,
                      onAttach,
                  }),
                  askToTakeOverTool({ computers, onAsk: (params) => onTakeOver?.(params) }),
              ]
            : []),
    ];

    if (!powers.is_coordinator) {
        if (workspace_id && powers.is_workspace_admin) {
            const admin = await grabWorkspaceAdminTools({ bot, user_id, workspace_id, powers, session_id, scopes, onTask });

            onWorkspaceAdmin?.(admin);
            tools.push(...admin.tools);

            return tools;
        }

        /**
         * Only what it already has goes: the bots it may hand to are the
         * ones it could ask for this user, read again when it does.
         */
        if (session_id && powers.can("hand_over_task")) {
            const workers = await askableBots({ user_id, requester_bot_id: bot_id, workspace_id });

            tools.push(
                handOverTaskTool({
                    user_id,
                    bot,
                    session_id,
                    powers,
                    workers,
                    grabTargets: () => askableBots({ user_id, requester_bot_id: bot_id, workspace_id }),
                    workspace_id,
                    onTask,
                }),
            );
        }

        return tools;
    }

    /**
     * The install's skills, MCP servers and tools are the coordinator's
     * wherever it works, a workspace as much as its own chat: a skill the
     * crew there needs is written from either, and every tool checks the
     * super admin again when it runs.
     */
    tools.push(...(await grabCoordinatorExtensionTools({ user_id, bot_id, session_id, workspace_id, onPropose })));

    /**
     * Knowledgebases are the coordinator's too: it lists them wherever it
     * works, and fills, re-indexes or deletes them when the super admin
     * asks in the chat. A reply has no computer, so a path names one.
     */
    tools.push(
        ...grabCoordinatorKnowledgebaseTools({
            user_id,
            bot_id,
            workspace_id,
            computer_id: null,
            attended: true,
        }),
    );

    const workspaces = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);

    /**
     * Offered even with no workspace yet: create_workspace adds the one it
     * makes to `workspaces`, and the same reply then sets its picture or
     * puts bots in it.
     */
    tools.push(
        createWorkspaceTool({ user_id, session_id, workspaces }),
        updateWorkspaceTool({ user_id, workspaces, workspace_id, scopes }),
        findWorkspaceTool({ user_id, workspace_id }),
        listWorkspacePeopleTool({ workspaces, workspace_id }),
        setUserWorkspaceRoleTool({ user_id, workspaces, workspace_id }),
    );

    tools.push(createBotTool({ user_id, session_id, workspaces, workspace_id }));

    const workers = await grabCrewWorkers({ workspace_id });

    if (workspace_id) {
        if (!workers.length) return tools;

        tools.push(delegateTaskTool({
            user_id,
            requester_id: bot_id,
            session_id,
            workspace_id,
            requester_name: bot.name || "The coordinator",
            workers,
            is_coordinator: true,
            onTask,
        }));
        tools.push(handOverScheduleTool({
            user_id,
            session_id,
            bot_id,
            workspace_id,
            is_coordinator: true,
            requester_name: bot.name || "The coordinator",
            workers,
        }));
        tools.push(
            setWorkspaceInstructionsTool({ user_id, workspace_id, workers }),
            updateBotTool({ user_id, workers }),
        );

        if (powers.can("set_bot_types")) {
            tools.push(setBotTypeTool({ user_id, session_id, bot_id, workers, workspaces, workspace_id }));
        }

        return tools;
    }

    tools.push(findBotTool(), listWorkspaceBotsTool({ user_id }));

    tools.push(deleteWorkspaceTool({ user_id, session_id, workspaces, attended }));

    if (!workers.length) return tools;

    tools.push(
        delegateTaskTool({
            user_id,
            requester_id: bot_id,
            session_id,
            workspace_id,
            requester_name: bot.name || "The coordinator",
            workers,
            workspaces,
            is_coordinator: true,
            onTask,
        }),
        handOverScheduleTool({
            user_id,
            session_id,
            bot_id,
            workspace_id,
            is_coordinator: true,
            requester_name: bot.name || "The coordinator",
            workers,
            workspaces,
        }),
    );

    tools.push(updateBotTool({ user_id, workers }), deleteBotTool({ user_id, session_id, workers, attended }));

    if (computers.length) {
        const access = Object.fromEntries(
            await Promise.all(
                workers.map(async (worker) => [
                    worker.id || 0,
                    await grabBotComputers({
                        bot_id: worker.id || 0,
                        include_workspace_computers: false,
                    }),
                ]),
            ),
        );

        tools.push(assignComputerTool({ user_id, session_id, workers, computers, access }));
    }

    tools.push(
        addBotToWorkspaceTool({ user_id, session_id, workers, workspaces }),
        removeBotFromWorkspaceTool({ user_id, session_id, workers, workspaces }),
    );

    if (powers.can("set_bot_types")) {
        tools.push(setBotTypeTool({ user_id, session_id, bot_id, workers, workspaces }));
    }

    return tools;
}
