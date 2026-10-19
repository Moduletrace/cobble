import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
};

/**
 * Deletes the workspace and its conversations, after a confirm. Its bots
 * and computers stay.
 */
export default function WorkspaceDeleteGroup({ workspace }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const name = workspace.name || "this workspace";

    const remove = async () => {
        if (!window.confirm(`Delete ${name} and every conversation in it? Its bots and computers stay.`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi({ path: "workspaces/delete-workspace", body: { workspace_id: workspace.id } });

        if (res.success) {
            window.location.href = "/admin/settings/workspaces";
            return;
        }

        setLoading(false);
        setError(res.msg || "Couldn't delete the workspace.");
    };

    return (
        <SettingsGroup
            id="delete"
            title="Delete"
            description="Deletes the workspace and its conversations. Its bots and computers stay yours."
        >
            <Button
                title={`Delete ${name}`}
                type="button"
                variant="outlined"
                color="gray"
                size="small"
                loading={loading}
                disabled={loading}
                onClick={remove}
                className="self-start"
            >
                Delete workspace
            </Button>
            <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
        </SettingsGroup>
    );
}
