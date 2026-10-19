import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
    onSaved: (workspace: BUN_SQLITE_COBBLE_WORKSPACES) => void;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * The workspace's name, what it's for, and the context every bot working
 * in it gets, saved together.
 */
export default function WorkspaceDetailsGroup({ workspace, onSaved }: Props) {
    const [name, setName] = useState(workspace.name || "");
    const [description, setDescription] = useState(workspace.description || "");
    const [system_prompt, setSystemPrompt] = useState(workspace.system_prompt || "");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<Status>();

    const dirty =
        name != (workspace.name || "") ||
        description != (workspace.description || "") ||
        system_prompt != (workspace.system_prompt || "");

    const submit = async () => {
        if (!dirty || loading) return;
        if (!window.confirm(`Save ${name || "this workspace"}?`)) return;

        setLoading(true);
        setStatus(undefined);

        const res = await postAdminApi<BUN_SQLITE_COBBLE_WORKSPACES>({
            path: "workspaces/update-workspace",
            body: { workspace_id: workspace.id, name, description, system_prompt },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "Couldn't save the workspace." });
            return;
        }

        setStatus({ success: true, msg: res.msg || "Saved." });
        onSaved(res.singleRes);
    };

    return (
        <SettingsGroup
            title="Workspace"
            description="Every bot working here gets this context on top of its own instructions."
        >
            <Form className="w-full gap-4! items-stretch" onSubmit={submit}>
                <Input
                    id="workspace-name"
                    title="Name"
                    label="Name"
                    showLabel
                    autoComplete="off"
                    defaultValue={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    id="workspace-description"
                    title="What it's for"
                    label="What it's for"
                    showLabel
                    autoComplete="off"
                    defaultValue={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Textarea
                    id="workspace-context"
                    title="Context"
                    label="Context"
                    showLabel
                    rows={8}
                    defaultValue={system_prompt}
                    info="Markdown. Goals, people, links, rules: whatever every bot here should know."
                    onChange={(e) => setSystemPrompt(e.target.value)}
                />
                <Row className="w-full gap-3! flex-nowrap items-center justify-between">
                    <SettingsStatus status={status} />
                    <Button
                        title="Save the workspace"
                        type="submit"
                        size="small"
                        loading={loading}
                        disabled={!dirty || loading}
                        className="ml-auto"
                    >
                        Save
                    </Button>
                </Row>
            </Form>
        </SettingsGroup>
    );
}
