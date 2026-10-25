import { useState } from "react";
import type { BotWorkspace, BotWithLastMessage, WorkspaceBot, WorkspaceWithActivity } from "@/src/types";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import WorkspaceBotModal from "@/src/components/general/workspace-bot-modal";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsList from "../../../(partials)/settings-list";
import SettingsStatus from "../../../(partials)/settings-status";
import BotWorkspaceRow from "./bot-workspace-row";

type Props = {
    bot: BotWithLastMessage;
    /**
     * Every workspace the user has.
     */
    workspaces: WorkspaceWithActivity[];
    /**
     * The workspaces the bot works in.
     */
    bot_workspaces: BotWorkspace[];
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Where the bot works. A worker can be added to or taken out of a
 * workspace; the coordinator works in every one of them.
 */
export default function BotWorkspacesGroup({
    bot,
    workspaces,
    bot_workspaces: initial,
}: Props) {
    const [bot_workspaces, setBotWorkspaces] = useState(initial);
    const [busy_id, setBusyId] = useState<number | "add">();
    const [status, setStatus] = useState<Status>();
    const [editing, setEditing] = useState<BotWorkspace>();
    const is_coordinator = bot.kind == "coordinator";

    const addable = workspaces.filter(
        (workspace) =>
            !bot_workspaces.some((member) => member.id == workspace.id),
    );

    const change = async ({
        path,
        workspace_id,
    }: {
        path: "add-bot" | "remove-bot";
        workspace_id: number;
    }) => {
        setBusyId(path == "add-bot" ? "add" : workspace_id);
        setStatus(undefined);

        const res = await postAdminApi({
            path: `workspaces/${path}`,
            body: { workspace_id, bot_id: bot.id },
        });

        setBusyId(undefined);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        if (path == "add-bot") {
            const workspace = workspaces.find(
                (item) => Number(item.id) == workspace_id,
            );

            if (workspace) {
                setBotWorkspaces((prev) => [
                    ...prev,
                    {
                        ...workspace,
                        workspace_system_prompt: null,
                        workspace_memory: null,
                    },
                ]);
            }
        } else {
            setBotWorkspaces((prev) =>
                prev.filter((workspace) => Number(workspace.id) != workspace_id),
            );
        }

        setStatus({ success: true, msg: res.msg || "Saved." });
    };

    /**
     * The save answers with the workspace's crew: this bot's row there
     * carries what it has for the workspace now.
     */
    const saved = ({ workspace_id, bots }: { workspace_id: number; bots: WorkspaceBot[] }) => {
        const member = bots.find((item) => item.id == bot.id);

        setBotWorkspaces((prev) =>
            prev.map((workspace) =>
                Number(workspace.id) == workspace_id
                    ? {
                          ...workspace,
                          workspace_system_prompt: member?.workspace_system_prompt || null,
                          workspace_memory: member?.workspace_memory || null,
                      }
                    : workspace,
            ),
        );
        setStatus({ success: true, msg: "Saved." });
    };

    return (
        <SettingsGroup
            id="workspaces"
            title="Workspaces"
            description={
                is_coordinator
                    ? "The coordinator works in every workspace."
                    : "Where this bot works. In each, the workspace's context, computers and models apply."
            }
        >
            <SettingsList
                is_empty={!bot_workspaces.length}
                empty={
                    is_coordinator
                        ? "No workspaces yet."
                        : "This bot is not in a workspace yet."
                }
            >
                {bot_workspaces.map((workspace) => (
                    <BotWorkspaceRow
                        key={workspace.id}
                        workspace={workspace}
                        busy={busy_id == workspace.id}
                        onEdit={() => setEditing(workspace)}
                        onRemove={
                            is_coordinator
                                ? undefined
                                : () =>
                                      change({
                                          path: "remove-bot",
                                          workspace_id: Number(workspace.id),
                                      })
                        }
                    />
                ))}
            </SettingsList>
            {is_coordinator ? null : (
                <InlineAddSelect
                    id="bot-add-workspace"
                    noun="workspace"
                    options={addable.map((workspace) => ({
                        value: String(workspace.id),
                        title:
                            workspace.name ||
                            `Workspace ${workspace.id}`,
                    }))}
                    loading={busy_id == "add"}
                    onAdd={({ value }) =>
                        change({
                            path: "add-bot",
                            workspace_id: Number(value),
                        })
                    }
                />
            )}
            <SettingsStatus status={status} />
            {editing ? (
                <WorkspaceBotModal
                    workspace_id={Number(editing.id)}
                    workspace_name={editing.name}
                    bot_id={Number(bot.id)}
                    bot_name={bot.name}
                    system_prompt={editing.workspace_system_prompt}
                    memory={editing.workspace_memory}
                    onClose={() => setEditing(undefined)}
                    onSaved={(bots) => saved({ workspace_id: Number(editing.id), bots })}
                />
            ) : null}
        </SettingsGroup>
    );
}
