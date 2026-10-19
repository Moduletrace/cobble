import { useState } from "react";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import type {
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";
import type { ComputerWithStatus, WorkspaceWithActivity } from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsList from "../../../(partials)/settings-list";
import SettingsStatus from "../../../(partials)/settings-status";
import ComputerWorkspaceRow from "./computer-workspace-row";

type Props = {
    computer: ComputerWithStatus;
    /**
     * Every workspace the user has.
     */
    workspaces: WorkspaceWithActivity[];
    /**
     * Workspaces linked now.
     */
    computer_workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Workspaces linked to the computer. Every bot in one can use it, and its
 * default computer comes first.
 */
export default function ComputerWorkspacesGroup({
    computer,
    workspaces,
    computer_workspaces: initial,
}: Props) {
    const [computer_workspaces, setComputerWorkspaces] = useState(initial);
    const [busy_id, setBusyId] = useState<number | "add">();
    const [status, setStatus] = useState<Status>();

    const addable = workspaces.filter(
        (workspace) =>
            !computer_workspaces.some(
                (linked) => linked.id == workspace.id,
            ),
    );

    const change = async ({
        path,
        workspace_id,
    }: {
        path: "add-computer" | "remove-computer";
        workspace_id: number;
    }) => {
        setBusyId(path == "add-computer" ? "add" : workspace_id);
        setStatus(undefined);

        const res = await postAdminApi({
            path: `workspaces/${path}`,
            body: { workspace_id, computer_id: computer.id },
        });

        setBusyId(undefined);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        if (path == "add-computer") {
            const workspace = workspaces.find(
                (item) => Number(item.id) == workspace_id,
            );

            if (workspace) {
                setComputerWorkspaces((prev) => [...prev, workspace]);
            }
        } else {
            setComputerWorkspaces((prev) =>
                prev.filter(
                    (workspace) => Number(workspace.id) != workspace_id,
                ),
            );
        }

        setStatus({ success: true, msg: res.msg || "Saved." });
    };

    return (
        <SettingsGroup
            id="workspaces"
            title="Workspaces"
            description="Every bot in these workspaces can use this computer. Its default computer comes first."
        >
            <SettingsList
                is_empty={!computer_workspaces.length}
                empty="Not linked to a workspace yet."
            >
                {computer_workspaces.map((workspace) => (
                    <ComputerWorkspaceRow
                        key={workspace.id}
                        workspace={workspace}
                        busy={busy_id == workspace.id}
                        onRemove={() =>
                            change({
                                path: "remove-computer",
                                workspace_id: Number(workspace.id),
                            })
                        }
                    />
                ))}
            </SettingsList>
            <InlineAddSelect
                id="computer-add-workspace"
                noun="workspace"
                options={addable.map((workspace) => ({
                    value: String(workspace.id),
                    title: workspace.name || `Workspace ${workspace.id}`,
                }))}
                loading={busy_id == "add"}
                onAdd={({ value }) =>
                    change({
                        path: "add-computer",
                        workspace_id: Number(value),
                    })
                }
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
